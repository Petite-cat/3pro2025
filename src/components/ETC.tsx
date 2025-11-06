//import React from "react";
import {Button, Typography} from '@mui/material';
import type { GameState} from "../types";

type StartProps = {
  me: any;
  onStart: () => void;
  imhost: boolean;
  gameState: GameState;
};

export function StartButton({me, onStart, imhost, gameState}:StartProps){
  if (me !== null && imhost && !gameState.started) {
    return <Button variant="contained" onClick={onStart}>Start Game</Button>;
  }
  else {
    return <></>;
  }
}

type TurnProps = {
  me: any;
  gameState: GameState;
  roomRef: any;
};

export function Turn({me, gameState, roomRef}:TurnProps){
  if (!gameState) return;
  if (gameState.players.length == 0) return <></>;
  if (gameState.cards.filter((c)=>c.matched >= 0).length == gameState.cards.length){
    return <Typography > {"Finished"} </Typography>;
  }
  if (gameState.players[gameState.currentTurn].id === me.id){
    return <Typography > {"Your Turn"} </Typography>;
  }
  else{
    const turn = gameState.currentTurn;
    return <Typography > {"Wait 今は" + roomRef.current.members[turn].metadata + "のターン"} </Typography>;
  }
}

type StandingsProps = {
  gameState: GameState;
};
export function Standings({gameState}:StandingsProps){
  const score=[...Array(gameState.players.length)].map((_p)=>0);
  gameState.cards.forEach((c)=> {if (c.matched >= 0){
    score[c.matched]++;
  }})
  const s = score.map((s,i)=>
    <Typography key={"standing"+i}> 
      {gameState.players[i].nickname} {i+1}{":"}{s} 
    </Typography>);
  return <>
          {gameState.started? <h3>得点</h3> : <></>}
          {s}
          </>
}



