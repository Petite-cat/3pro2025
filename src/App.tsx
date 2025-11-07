import {nowInSec, uuidV4, SkyWayStreamFactory, SkyWayContext, SkyWayRoom, SkyWayAuthToken, LocalDataStream } from '@skyway-sdk/room';
import { useCallback,  useRef, useState } from 'react'
import {Box, Stack, Button, TextField} from '@mui/material';
//import Cards from './components/Cards.tsx';
import Board from './components/Board.tsx';
import  type {GameState, Card} from './types';
import {Turn, StartButton, Standings} from './components/ETC';

const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  version: 3,
  scope: {
    appId: "b167f29e-441e-4232-84be-d97385c9e6ab",
    rooms: [
      {
        name: "*",
        methods: ["create", "close", "updateMetadata"],
        member: {
          name: "*",
          methods: ["publish", "subscribe", "updateMetadata"],
        },
      },
    ],
  },
}).encode("6gaA2L1uyOe21JlTuc6EAIvDZHLSQ/7uCwqkEfuT8h8=");

function App() {

  const [dataStream, setDataStream] = useState<LocalDataStream>();
  const [ me, setMe ] = useState<any>(null);
  const [ gameState, setGameState ] = useState<GameState>({players:[], currentTurn:0, cards: [], started: false, cursor:{x:0, y:0}})
  const [ imhost, setImhost ] = useState(false);
  const [ nickname, setNickname] = useState("");
  const [ roomName, setRoomName] = useState("");
  const roomRef = useRef<any>(null);
  const boardRef = useRef<any>(null);
  
  
  const onJoinClick = useCallback(async (nickname:string, roomName:string) => {
    if ( token == null) return;

    const context = await SkyWayContext.Create(token);

    // ルームを取得、または新規作成
    const room = await SkyWayRoom.FindOrCreate(context, {
      type: 'p2p',
      name: roomName,
    });
    roomRef.current = room;

    const me = await room.join({metadata:nickname});
    setMe(me);

    
    if (room.members.length === 1){
      // I am the host
      setImhost(true);
      const cards = [...Array(52).keys()].map(i => ({id:i, flipped:false, matched: -1}));
      cards.sort((_a, _b) => 0.5 - Math.random()); // card shuffle
      setGameState({players:gameState.players.splice(0),
		    currentTurn:gameState.currentTurn,
		    cards:cards,
		    started:gameState.started,
        cursor:gameState.cursor
      });
    }
    
    const data = await SkyWayStreamFactory.createDataStream();
    await me.publish(data);
    await setDataStream(data);

    room.publications.forEach(async (p) => {
      // 自分のは subscribe しない
      if (p.publisher.id === me.id) return;
      if (p.contentType !== "data") return;
      // すでに subscribe 済みならスキップ
      const already = me.subscriptions.some(sub => sub.publication.id === p.id);
      if (!already) {
	      const sub = await me.subscribe(p);
      	// @ts-ignore
        sub.stream.onData.add((d:any)=>{
          const mesg = JSON.parse(d);
          console.log(mesg.newstate);
          if (mesg.newstate !== null) {
            setGameState(mesg.newstate);
          }
        });
      }
    });

    room.onMemberJoined.add((_e) => {
      if (imhost){
	      const newstate = {players:gameState.players.splice(0),
			  currentTurn:gameState.currentTurn,
			  cards:gameState.cards,
			  started:gameState.started,
        cursor:gameState.cursor,
	      };
        setGameState(newstate);
        data.write(JSON.stringify(newstate));
        console.log(JSON.stringify(gameState));
      }
    });
    // その後に参加してきた人の情報を取得
    room.onStreamPublished.add(async (e) => {
      if (e.publication.publisher.id !== me.id && e.publication.contentType === "data") {
        console.log(e.publication.publisher.id, me.id);
        const sub = await me.subscribe(e.publication);
        // @ts-ignore
        sub.stream.onData?.add((d:any)=>{
          const mesg = JSON.parse(d);
          console.log(mesg.newstate);
          if (mesg.newstate !== null) {
            setGameState(mesg.newstate);
          }
        });
      }
    });
  }, [token]);

  //ここを考える
  function flip(card:Card){
    //flipされた時にmemoryを操作を追加
    if (gameState.players[gameState.currentTurn].id !== me.id){ //自分の番だけflip出来る。
      return;
    }

    const currentlyFlipped = gameState.cards.filter((c) => c.flipped && c.matched < 0);
    if (currentlyFlipped.length >= 2) {
    return;
  }

    if (card.matched >= 0){ // マッチしたカードはflip出来ない
      return;
    }
    //clickされたカードをflipする
    const cards = gameState.cards.map((c)=>{
      if (c.id == card.id){ // カードをflipする。
	      return {id:c.id, flipped:true, matched:c.matched};
      }
      else{
	      return c;
      }
    })
    const tmpState = {cards:cards, // flip後の状態
		      players:gameState.players,
		      currentTurn:gameState.currentTurn,
		      started:gameState.started,
          cursor:gameState.cursor,
    };
    setGameState(tmpState);
    dataStream?.write(JSON.stringify({newstate:tmpState}));
    
    //表になっているカードを配列flippedCardsに入れる
    const flippedCards = cards.filter((c)=>c.flipped);
    let turnAdd = 0; //次の手番 0: 自分 1: 次の人

    function newCards(){
      if (flippedCards.length == 2 && (flippedCards[0].id % 13 != flippedCards[1].id % 13)){
	      turnAdd = 1; // 手番を次の人に
	      return cards.map((c) => ({id: c.id, flipped:false, matched:c.matched}))
      }
      else if (flippedCards.length == 2 && (flippedCards[0].id % 13 == flippedCards[1].id % 13)){
	      return cards.map((c) => {
	        if (c.id == flippedCards[0].id || c.id == flippedCards[1].id){
	          return {id: c.id, flipped:false, matched:gameState.currentTurn};
	        }
	      else{
	        return {id: c.id, flipped:false, matched:c.matched};
	      }
	      })
      }
      else {
	      return cards;
      }
    }
    const newcards = newCards()
    const newState = {cards:newcards,
		      players:gameState.players,
		      currentTurn:(gameState.currentTurn + turnAdd) % gameState.players.length,
		      started: gameState.started,
          cursor:gameState.cursor,
    };

    if (flippedCards.length ==2){
      setTimeout(() => {
	      setGameState(newState);
	      dataStream?.write(JSON.stringify({newstate:newState}));
      }, 1800); // 2000ms = 2秒
    }
  }
  
  

  function start(){
    const players = roomRef.current.members.map((m:any) => ({
      id: m.id,
      nickname: m.metadata, //51行
    }));
    const status = {
        cards:gameState.cards,
		    players: players,
		    currentTurn:gameState.currentTurn,
		    started:true,
        cursor: gameState.cursor

      } //types.tsに説明
    setGameState(status);
    dataStream?.write(JSON.stringify({newstate:status}));
  }

  function isMyturn(me:any, gameState:any){
    return (gameState.players[gameState.currentTurn].id == me.id);
  }

  function move(event:any){
    if (!isMyturn(me,gameState)) return;
    const board = boardRef.current;
    const point = board.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const boardP = point.matrixTransform(board.getScreenCTM()?.inverse());
    
    const newstate = {
      players: gameState.players,
      currentTurn: gameState.currentTurn,
      cards: gameState.cards,
      started: gameState.started,
      cursor: {x:boardP.x, y:boardP.y}
    }
    setGameState(newstate);
    dataStream?.write(JSON.stringify({newstate:newstate})); //?は、ない場合は何もしない
    console.log(boardP);

  }
  
  return(
    <>
      <Stack>
	    {roomName}{gameState.cursor.x}
	    <Stack direction="row" spacing={1}>
	      {me === null? (<>
	      <Button variant="contained" onClick={()=>onJoinClick(nickname, roomName)}>join</Button>
	      <TextField   id="roomname" value={roomName} label="room name" variant="outlined"
			  onChange={(e)=>{console.log(e.target.value);setRoomName(e.target.value)}}/>
	      <TextField   id="nickname" value={nickname} label="nickname" variant="outlined"
			  onChange={(e)=>setNickname(e.target.value)}/>
	      </>): <></>
	      }
	      <StartButton me={me} onStart={start} imhost={imhost} gameState={gameState}/>
	    </Stack>
	      <Turn me={me} gameState={gameState} roomRef={roomRef}/>
	      <Box  sx={{display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }} >
	        <Board ref={boardRef} me={me} gameState={gameState} onFlip={flip} move={move}/> 
	      </Box>
	    <Stack>
	      <Standings gameState={gameState}/>
	    </Stack>
        </Stack>
    </>
  )
}

export default App
