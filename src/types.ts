export type Player = { id: string; nickname: string };
export type Card = { 
  id: number; //0〜51の通し番号
  flipped: boolean; //表か
  matched: number //誰がとったか
};
export type GameState = {
  players: Player[];
  currentTurn: number; //今誰のターンか
  cards: Card[];
  started: boolean;
  cursor: {x:number, y:number}
};
