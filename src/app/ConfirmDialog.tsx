import { useStore } from '../store/store';
import { Modal } from './Modal';

/** The "Are you sure?" step for anything that can't be undone. Requested through the store. */
export function ConfirmDialog() {
  const request = useStore((s) => s.confirm);
  if (!request) return null;
  const close = () => useStore.getState().requestConfirm(null);
  return (
    <Modal
      title={request.title}
      width={440}
      onClose={close}
      footer={
        <>
          <button className="btn" onClick={close}>
            Cancel
          </button>
          <button
            className={`btn ${request.danger ? 'btn--danger-solid' : 'btn--primary'}`}
            onClick={() => {
              close();
              request.onConfirm();
            }}
          >
            {request.confirmLabel}
          </button>
        </>
      }
    >
      <p className="modal__text">{request.body}</p>
    </Modal>
  );
}
