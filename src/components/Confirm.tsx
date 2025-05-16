import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { confirmStyles as styles } from './styles/Confirm.styles';
import { formatRoomId } from '../utils/formatRoomId';

interface ConfirmProps {
  isVacant?: boolean;
  room?: string;
  onClose: (action: boolean) => void;
}

const Confirm = ({ isVacant = false, room = '', onClose }: ConfirmProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleClose = (action: boolean) => {
    setOpen(false);
    setTimeout(() => {
      onClose(action);
    }, 300);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={styles.overlay} />
        </Transition.Child>

        <div className={styles.container}>
          <button className="w-0 h-0"></button>
          <div className={styles.wrapper}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className={styles.panel}>
                <div>
                  <div className={styles.imageWrapper}>
                    <img className={styles.image} src="/images/logo.jpg" alt="Home App" />
                  </div>
                  <div className={styles.contentWrapper}>
                    <Dialog.Title as="h3" className={styles.title}>
                      {isVacant ? 'Check-out?' : 'Check-in?'}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className={styles.message}>
                        Choose Yes to {isVacant ? 'Check-out' : 'Check-in'} Room no. {formatRoomId(room)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    className={styles.confirmButton}
                    onClick={() => handleClose(true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => handleClose(false)}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Confirm;