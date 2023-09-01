import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';

import { getLiteTraceBridge } from 'api/litetrace_bridge';
import { putLiteTraceBridge } from 'api/litetrace_bridge';
import { getMeshList } from 'api/meshes';
import useModal from 'hooks/useModal';

import Loading from 'components/Loading';
import Modal from 'components/Modal';

import { BridgeContext } from './litetrace_bridge';

export default function LiteTraceBridgeForm({ match }) {
  const { t } = useTranslation();
  const [liteTraceBridge, setLiteTraceBridge] = useContext(BridgeContext);

  const [liteTraceBridgeList, setLiteTraceBridgeList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  const { id } = match.params;
  const [meshList, setMeshList] = useState([]);
  const { isOpen } = useModal();
  const [selectedMesh, setSelectedMesh] = useState('');

  const {
    register,
    setValue,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getLiteTraceBridge()
        .then((data) => setLiteTraceBridgeList(data))
        .catch((error) => console.log('Something went wrong', error)),
      getMeshList().then((data) => {
        setMeshList(data);
        const selectedMeshName = history.location.state?.data?.mesh_name;
        if (selectedMeshName) {
          const selectedMeshObj = data.find((mesh) => mesh.name === selectedMeshName);
          if (selectedMeshObj) {
            setSelectedMesh(selectedMeshObj.id);
            setValue('mesh', selectedMeshObj.id);
          }
        }
      })
    ]).finally(() => setIsLoading(false));

    if (id) {
      const data = history.location.state?.data;
      if (data) {
        const fields = ['model_type', 'mac', 'ip', 'port', 'is_dhcp'];
        fields.forEach((field) => setValue(field, data[field]));
      }
    }
  }, [id, history, setValue]);

  useEffect(() => {
    if (id) {
      const data = history.location.state?.data;
      setValue('litetrace_bridge', data['litetrace_bridge']);
    }
  }, [id, history, setValue]);

  useEffect(() => {
    if (id) {
      const data = history.location.state?.data;
      setValue('mesh', data['mesh']);
      setValue('mesh_name', data['mesh_name']);
    }
  }, [meshList, id, history, setValue]);

  function onSubmit(data) {
    setIsLoading(true);
    putLiteTraceBridge(id, data)
      .then((data) => handleLiteTracebridgeTable(data))
      .catch((error) => handleError(error))
      .finally(() => setIsLoading(false));
  }

  function handleError(error) {
    for (let [name, message] of Object.entries(error)) {
      setError(name, { type: 'manual', message: message[0] });
    }
  }

  function handleLiteTracebridgeTable(data) {
    setLiteTraceBridge(
      id
        ? liteTraceBridge.map((litetrace_bridge) =>
            litetrace_bridge.id === parseInt(id) ? data : litetrace_bridge
          )
        : [...liteTraceBridge, data]
    );
    handleCloseModal();
  }

  function handleCloseModal() {
    history.push('/airux-admin/litetrace_bridge');
  }

  return (
    <Modal
      isOpen={isOpen}
      closeModal={handleCloseModal}
      title={id ? t('Edit LiteTrace Bridge') : t('Create LiteTrace Bridge')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="mt-4">
          <label htmlFor="ip" className="block text-sm">
            {t('IP Address')}
          </label>
          <input
            className="mt-2 block w-full rounded-md border px-4 py-2 text-primary focus:border-primary focus:outline-none"
            placeholder={t('IP Address')}
            {...register('ip')}
          />
          {errors.mode && <div className="text-xs text-red-600">{errors.ip.message}</div>}
        </div>

        <div className="mt-4">
          <label htmlFor="port" className="block text-sm">
            {t('Port')}
          </label>
          <input
            className="mt-2 block w-full rounded-md border px-4 py-2 text-primary focus:border-primary focus:outline-none"
            placeholder={t('Port')}
            {...register('port')}
          />
          {errors.mode && <div className="text-xs text-red-600">{errors.port.message}</div>}
        </div>

        <div className="mt-4 flex place-content-end">
          {errors.non_field_errors && (
            <div className="text-xs text-red-600 ">{errors.non_field_errors.message}</div>
          )}
          <button
            className="mr-4 cursor-pointer rounded border border-primary px-4 py-2 text-primary"
            type="button"
            onClick={handleCloseModal}
          >
            {t('Cancel')}
          </button>
          <button type="submit" className="btn-primary">
            {t('Submit')}
          </button>
        </div>
      </form>
      <Loading isOpen={isLoading} />
    </Modal>
  );
}
