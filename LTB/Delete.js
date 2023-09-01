import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

import { deleteLiteTraceBridge } from 'api/litetrace_bridge';
import useModal from 'hooks/useModal';

import Modal from 'components/Modal';

import { BridgeContext } from './litetrace_bridge';

export default function LiteTraceBridgeDelete({ match }) {
  const { t } = useTranslation();
  const [bridges, setBridges] = useContext(BridgeContext);
  const history = useHistory();
  const { id } = match.params;
  const { isOpen } = useModal();

  const [name, setName] = useState();

  useEffect(() => {
    if (id) {
      const data = history.location.state?.data;
      setName(data.name);
    }
  }, [id, history, setName]);

  function onSubmit() {
    deleteLiteTraceBridge(id)
      .then((res) => {
        setBridges(bridges.filter((bridge) => bridge.id !== parseInt(id)));
        handleCloseModal();
      })
      .catch((error) => console.log('Something went wrong', error));
    handleCloseModal();
  }

  function handleCloseModal() {
    history.push('/airux-admin/litetrace_bridge');
  }

  return (
    <Modal isOpen={isOpen} closeModal={handleCloseModal} title={t('Delete LiteTrace Bridge')}>
      <div className="mt-4">
        <div htmlFor="name" className="block text-sm">
          {t('Are you sure you want to delete {{name}}?', { name })}
        </div>
      </div>

      <div className="mt-4 flex place-content-end">
        <button
          className="mr-4 cursor-pointer rounded border border-primary px-4 py-2 text-primary"
          type="button"
          onClick={handleCloseModal}
        >
          {t('Cancel')}
        </button>
        <button className="btn-primary" type="button" onClick={onSubmit}>
          {t('Delete')}
        </button>
      </div>
    </Modal>
  );
}
