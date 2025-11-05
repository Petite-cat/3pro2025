import { forwardRef } from "react";
import type { GameState, Card} from "../types";
import Cards from "./Cards";

type BoardProps = {
  me: any;
  gameState: GameState;
  onFlip: (c: Card) => void;
  move: any;
};

/*function moveTest(event){
  console.log(event.clientX, event.clientY)
}*/

function isMyturn(me:any, gameState:any){
  return (gameState.players[gameState.currentTurn].id == me.id);
}

function Cursor({me, gameState}:any){
  if (isMyturn(me, gameState)){
    return;
  }
  return(
    <text x={gameState.cursor.x} y={gameState.cursor.y} 
    fontSize={20} stroke="red">{gameState.players[gameState.currentTurn].nickname}</text>
  )
}

const Board=forwardRef<SVGSVGElement, BoardProps>((props, ref)=>{
  const {me, gameState, onFlip, move}:BoardProps = props;
  if (gameState.started){
    return( 
      <svg ref={ref} width={"800"} height={"400"} onMouseMove={(e)=>move(e)}>
        <Cards cards={gameState.cards} onFlip={onFlip}/>
        <Cursor me={me} gameState={gameState}/>
      </svg>
    );
  }
  else if (me !== null){
    return <svg width={"800"} height={"400"}>
      <text x={200} y={200} fontSize={"100px"} stroke={"black"}> お待ち下さい</text>
    </svg>;
  }
})
export default Board;

