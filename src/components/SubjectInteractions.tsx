import React, { useCallback, useEffect, useState } from 'react';
import { useQuery, useTrpc } from './useTrpc';
import { useActiveAfterKeySequence } from './useActiveAfterKeySequence';

export interface SubjectInteractionsProps {
  readonly subject: string;
}

export const SubjectInteractions = ({ subject }: SubjectInteractionsProps) => {
  const trpc = useTrpc();
  const queryFn = useCallback(() => trpc.interactions.get.query({ subject }), [trpc]);
  const query = useQuery(queryFn);

  const addInteraction = useCallback(
    (interaction: string) =>
      trpc.interactions.addInteraction.mutate({ subject, type: interaction }),
    [trpc, subject],
  );

  const interactions = [...(query.data?.interactions ?? [])].sort(
    (a, b) => b.count - a.count,
  );

  const easterEggActive = useActiveAfterKeySequence(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']);

  return (
    <>
      {interactions.map((interaction) => (
        <Interaction
          key={interaction.type}
          interaction={interaction.type}
          count={interaction.count}
          addInteraction={() => addInteraction(interaction.type)}
        />
      ))}

      {easterEggActive && (
        <input className='w-6 border-2 clear-both' aria-label='Secret emoji input' type='text' placeholder=''
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   void addInteraction(e.currentTarget.value);
                   e.currentTarget.value = '';
                 }
               }}
        />
      )}
    </>
  );
};

interface InteractionProps {
  readonly interaction: string;
  readonly count: number;
  readonly addInteraction: () => void;
}

const Interaction = (props: InteractionProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(Math.max(count, props.count));
  }, [count, setCount, props]);

  function onClick() {
    // Give the illusion of speed and refresh later.
    setCount(count + 1);
    props.addInteraction();
  }

  return (
    <InteractionButton interaction={props.interaction} onClick={onClick}>
      {Intl.NumberFormat().format(count)}
    </InteractionButton>
  );
};

type InteractionButtonProps = React.PropsWithChildren<{
  readonly interaction: React.ReactNode;
  readonly onClick: () => void;
}>;

const InteractionButton = (props: InteractionButtonProps) => (
  <button
    onClick={props.onClick}
    className='flex justify-center items-center gap-1 hover:bold'
  >
    <div className='text-xl'>{props.interaction}</div>
    {props.children}
  </button>
);
