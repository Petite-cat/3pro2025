//import React from "react";
import type { Card as CardType } from "../types";
import Card from "./Card";

type CardsProps = {
  cards: CardType[];
  onFlip: (c: CardType) => void;
};

export default function Cards({ cards, onFlip }: CardsProps) {
  return (
    <>
      {cards.map((c, idx) => (
        <Card
          key={`card${c.id}`}
          i={idx % 13}
          j={Math.floor(idx / 13)}
          c={c}
          onFlip={onFlip}
        />
      ))}
    </>
  );
}
