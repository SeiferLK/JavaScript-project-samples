import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { DateTime } from 'luxon';

import { useGetEtagModels } from '~/api/etag_models';
import { useGetShelfEtag, usePatchShelfEtag, usePutShelfEtagScreenUpdate } from '~/api/etags';
import { useLoadMoreGateways } from '~/api/gateways';
import { useGetShelves } from '~/api/shelves';
import { useLoadMoreStores } from '~/api/stores';
import Button from '~/components/Elements/Button';
import { MyForm, useMyForm } from '~/components/Elements/Form';
import FormInput from '~/components/Form/FormInput';
import FormSelect from '~/components/Form/FormSelect';
import useAuth from '~/hooks/useAuth';
import useDebounce from '~/hooks/useDebounce';

const DEFAULT_FIELDS = {
  id: '',
  shelf_code: ''
};

export default function ShelfForm() {
  const { i18n, t } = useTranslation();
  const { shelfEtagId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /** @type {import('@tanstack/react-query').UseQueryResult<import('./defs').ShelfEtag>} */
  const { data, isLoading } = useGetShelfEtag(shelfEtagId || null);
  const { data: etagModels, isLoading: etagModelsIsLoading } = useGetEtagModels();

  const [storeSearch, setStoreSearch] = useState(undefined);
  const debouncedStoreSearch = useDebounce(storeSearch, 300);
  const {
    data: stores,
    isLoading: storesIsLoading,
    isFetching: storesIsFetching,
    isFetchingNextPage: storesIsFetchingNextPage,
    fetchNextPage: fetchStoresNextPage
  } = useLoadMoreStores({ search: debouncedStoreSearch });
  const [gatewaySearch, setGatewaySearch] = useState(undefined);
  const debouncedGatewaySearch = useDebounce(gatewaySearch, 300);
  const {
    data: gateways,
    isLoading: gatewaysIsLoading,
    isFetching: gatewaysIsFetching,
    isFetchingNextPage: gatewayIsFetchingNextPage,
    fetchNextPage: fetchGatewayNextPage
  } = useLoadMoreGateways({ search: debouncedGatewaySearch });

  const mutationPatch = usePatchShelfEtag(shelfEtagId || null);

  const mutationPutScreenUpdate = usePutShelfEtagScreenUpdate(shelfEtagId || null);

  /** @type {import('react-hook-form').UseFormReturn<import('./defs').PatchShelfEtagPayload>} */
  const form = useMyForm();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
    setValue,
    ...methods
  } = form;

  useEffect(() => {
    // After fetching Etag data, set it on the form
    // If no data is available, set the default values manually
    reset(data || DEFAULT_FIELDS);
    if (data?.last_scanned_at) {
      setValue('last_scanned_at', DateTime.fromISO(data?.last_scanned_at).toJSDate());
    } else {
      setValue('last_scanned_at', null);
    }
    if (data?.last_scanned_rssi) {
      setValue('signal_formatted', `${data?.last_scanned_rssi} dBm`);
    } else {
      setValue('signal_formatted', 'N/A');
    }
  }, [data, setValue, reset, i18n.language]);

  /**
   * @param {import('./defs').PatchShelfEtagPayload} data
   */
  const onSubmit = async (data) => {
    try {
      const { gateway, shelf, store, model } = data;
      await mutationPatch.mutateAsync({
        gateway: gateway || null,
        shelf: shelf || null,
        store: store || null,
        model
      });
      queryClient.invalidateQueries(['/web_api/data/shelf_etags/']);
      toast.success(t('Saved'));
    } catch (e) {
      handleError(e.response.data);
    }
  };

  function handleError(error) {
    for (let [name, message] of Object.entries(error)) {
      // Check if error in DEFAULT_FIELDS
      if (DEFAULT_FIELDS.hasOwnProperty(name))
        setError(name, { type: 'server', message: message[0] });
    }
  }

  async function handleScreenUpdateClick() {
    try {
      await mutationPutScreenUpdate.mutateAsync();
      toast.success(t('Screen updated'));
    } catch (e) {
      // Handled on HOC queryClient
    }
  }

  return (
    <MyForm
      className="grid grid-cols-2 gap-2 px-5 py-3"
      onSubmit={handleSubmit(onSubmit)}
      showSkeleton={isLoading}
      {...form}
    >
      <h2 className="col-span-2 pb-4 text-xl font-light text-white">{t('Edit Panel')}</h2>
      <div className="flex items-center justify-end gap-2">
        <label className="text-right text-white">{t('Panel ID')}</label>
        <div className="w-8/12">
          <FormInput isLayoutRow name="id" disabled />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        <div className="text-right text-white">{t('Panel S/N')}</div>
        <div className="w-7/12">
          <FormInput isLayoutRow name="serial" disabled />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="text-right text-white">{t('MAC')}</div>
        <div className="w-8/12">
          <FormInput
            isLayoutRow
            name="mac"
            placeholder="MAC"
            required
            error={errors.mac}
            disabled
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="text-right text-white">{t('Shelf Number')}</div>
        <div className="w-7/12">
          <ShelfCodeSelect />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="model" className="text-right text-white">
          {t('Model')}
        </label>
        <div className="w-8/12">
          <FormSelect
            isLayoutRow
            control={control}
            name="model"
            isLoading={etagModelsIsLoading}
            options={etagModels ? etagModels.map((e) => ({ value: e.id, label: e.name })) : []}
            error={errors.model}
            required
          />
        </div>
      </div>
      <div className="col-span-2 gap-2 py-2">
        {data?.capture && <img src={data.capture} alt="Panel" />}
      </div>
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="store" className="text-right text-white">
          {t('Store')}
        </label>
        <div className="w-8/12">
          <FormSelect
            isLayoutRow
            control={control}
            name="store"
            isLoading={storesIsLoading || storesIsFetchingNextPage || storesIsFetching}
            onInputChange={(value) => {
              setStoreSearch(value);
              if (!value) {
                setValue('shelf', undefined);
              }
              return value;
            }}
            options={
              stores
                ? stores.pages.flatMap((page) =>
                    page.results.map((e) => ({ value: e.id, label: e.name }))
                  )
                : []
            }
            error={errors.store}
            onMenuScrollToBottom={() => fetchStoresNextPage()}
            isClearable
            isDisabled={!!user.store_id}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        <label htmlFor="gateway" className="text-right text-white">
          {t('Gateway')}
        </label>
        <div className="w-8/12">
          <FormSelect
            isLayoutRow
            control={control}
            name="gateway"
            isLoading={gatewaysIsLoading || gatewayIsFetchingNextPage || gatewaysIsFetching}
            onInputChange={(value) => {
              setGatewaySearch(value);
              return value;
            }}
            options={
              gateways
                ? gateways.pages.flatMap((page) =>
                    page.results
                      .filter((gateway) =>
                        methods.watch('store')
                          ? methods.getValues('store') === gateway.store
                          : gateway
                      )
                      .map((e) => ({ value: e.id, label: e.serial }))
                  )
                : []
            }
            error={errors.gateway}
            onMenuScrollToBottom={() => fetchGatewayNextPage()}
            isClearable
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="text-right text-white">{t('F/W')}</div>
        <div className="w-8/12">
          <FormInput isLayoutRow name="version" placeholder="N/A" disabled />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        <div className="text-right text-white">{t('Last Access')}</div>
        <div className="w-8/12">
          <FormInput isLayoutRow name="last_scanned_at" placeholder="N/A" disabled />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="text-right text-white">{t('Signal')}</div>
        <div className="w-8/12">
          <FormInput isLayoutRow name="last_scanned_rssi" placeholder="N/A" disabled />{' '}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <div className="text-right text-white">{t('Battery')}</div>
        <div className="w-8/12">
          <FormInput isLayoutRow name="battery_percentage" placeholder="N/A" disabled />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        <div className="text-right text-white">{t('Set Screen Data')}</div>
        <div className="w-8/12">
          <FormInput isLayoutRow name="sid" placeholder="N/A" disabled />
        </div>{' '}
      </div>
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        <div className="text-right text-white">{t('Etag Screen Data')}</div>
        <div className="w-8/12">
          <FormInput isLayoutRow name="adv_data.sid" placeholder="N/A" disabled />
        </div>{' '}
      </div>
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        <div className="text-right text-white">{t('Item Duration')}</div>
        <div className="w-8/12">
          <FormInput
            isLayoutRow
            name="sale_item_registered_at_formatted"
            placeholder="N/A"
            disabled
          />
        </div>{' '}
      </div>
      <div className="col-span-2 mt-2 flex justify-center gap-2">
        <Button variant="warning" type="submit" isLoading={mutationPatch.isLoading}>
          {t('Save')}
        </Button>
        <Button onClick={handleScreenUpdateClick} isLoading={mutationPutScreenUpdate.isLoading}>
          {t('Screen update')}
        </Button>
      </div>
    </MyForm>
  );
}

function ShelfCodeSelect() {
  /** @type {import('react-hook-form').UseFormReturn<import('./defs').PatchShelfEtagPayload>} */
  const { control, formState } = useFormContext();
  const selectedStore = useWatch({ control, name: 'store' });

  /** @type {{isFetchingNextPage: boolean, fetchNextPage: () => any} & import('@tanstack/react-query').UseQueryResult<import('./defs').GetShelvesResponse>} */
  // @ts-ignore
  const {
    data: shelves,
    isLoading: shelvesIsLoading,
    isFetching: shelvesIsFetching,
    isFetchingNextPage: shelvesIsFetchingNextPage,
    fetchNextPage
  } = useGetShelves({ store: selectedStore });

  return (
    <FormSelect
      isLayoutRow
      control={control}
      name="shelf"
      isDisabled={
        shelvesIsLoading ||
        shelvesIsFetchingNextPage ||
        shelvesIsFetching ||
        Boolean(!selectedStore)
      }
      options={shelves?.results.map((e) => ({ value: e.id, label: e.code })) || []}
      error={formState.errors.shelf}
      onMenuScrollToBottom={fetchNextPage}
      isClearable
    />
  );
}
