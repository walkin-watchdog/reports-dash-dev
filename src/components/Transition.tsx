import { Fragment, ReactNode } from 'react';
import { Transition as HeadlessTransition } from '@headlessui/react';

interface TransitionProps {
  show: boolean;
  children: ReactNode;
}

const Transition = ({ show, children }: TransitionProps) => {
  return (
    <HeadlessTransition
      as={Fragment}
      show={show}
      enter="transform transition duration-300 ease-out"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="transform duration-200 transition ease-in"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      {children}
    </HeadlessTransition>
  );
};

export default Transition;