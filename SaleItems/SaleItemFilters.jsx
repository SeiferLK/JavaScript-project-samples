import { useTranslation } from 'react-i18next';

import { useGetAnalysisSaleItemInfoEtagLabels } from '~/api/analysis/saleitem_info';
import { useGetAnalysisSaleItemCategories } from '~/api/analysis/saleitem_results';
import Button from '~/components/Elements/Button';
import { MyForm, useMyForm } from '~/components/Elements/Form';
import FormInput from '~/components/Form/FormInput';
import FormInputRadios from '~/components/Form/FormInputRadios';
import FormInputRange from '~/components/Form/FormInputRange';
import FormSelect from '~/components/Form/FormSelect';
import FormSelectRadios from '~/components/Form/FormSelectRadios';
import { removeEmpty } from '~/helpers/utils';
import { useAnalysisStore } from '~/stores/analysis';

const defaultValues = {
  division: '',
  rating__gte: '',
  rating__lte: '',
  item_code__icontains: '',
  item_disp__icontains: '',
  period: '',
  period_radio: 'more',
  weekday: '0',
  etag_label_display: '',
  etag_label_display_radio: 'include',
  etag_label_location: '',
  etag_label_location_radio: 'include',
  etag_label_identify: '',
  etag_label_identify_radio: 'include',
  etag_registered_serial__icontains: ''
};

export default function SaleItemFilters({ isLoading, setFilters, isGraphOn }) {
  const { t } = useTranslation();
  const selectedStore = useAnalysisStore((state) => state.selectedStore);

  const { data: categoriesData, isLoading: categoriesIsLoading } = useGetAnalysisSaleItemCategories(
    { store_id: selectedStore?.id },
    { enabled: !!selectedStore }
  );

  const { data: etagLabelsData, isLoading: etagLabelsIsLoading } =
    useGetAnalysisSaleItemInfoEtagLabels(
      { store_id: selectedStore?.id },
      { enabled: !!selectedStore }
    );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    ...methods
  } = useMyForm({ defaultValues });

  const daysOfWeek = [
    { label: t('All'), value: '0' },
    { label: t('Monday'), value: '1' },
    { label: t('Tuesday'), value: '2' },
    { label: t('Wednesday'), value: '3' },
    { label: t('Thursday'), value: '4' },
    { label: t('Friday'), value: '5' },
    { label: t('Saturday'), value: '6' },
    { label: t('Sunday'), value: '7' }
  ];

  const onSubmit = async (data) => {
    const cleanObj = removeEmpty(data);

    // Sanitize Rating fields
    if (Object.hasOwn(cleanObj, 'rating__gte') || Object.hasOwn(cleanObj, 'rating__lte')) {
      cleanObj.rating__gte = (cleanObj.rating__gte ?? 0) * 10;
      cleanObj.rating__lte = (cleanObj.rating__lte ?? 5) * 10;
    }

    // Sanitize Period fields
    if (Object.hasOwn(cleanObj, 'period')) {
      if (cleanObj.period_radio === 'more') {
        cleanObj.etag_registered_period__gte = cleanObj.period;
      } else {
        cleanObj.etag_registered_period__lte = cleanObj.period;
      }
      delete cleanObj.period;
    }
    delete cleanObj.period_radio;

    // Sanitize Display, Location and Identify fields
    ['etag_label_display', 'etag_label_location', 'etag_label_identify'].forEach((e) => {
      if (Object.hasOwn(cleanObj, e)) {
        if (cleanObj[`${e}_radio`] === 'include') {
          cleanObj[`${e}`] = cleanObj[e];
        } else {
          cleanObj[`${e}__not`] = cleanObj[e];
          delete cleanObj[e];
        }
      }
      delete cleanObj[`${e}_radio`];
    });

    setFilters(cleanObj);
  };

  const onReset = () => {
    reset(defaultValues);
    setFilters({});
  };

  return (
    <MyForm
      className="flex justify-between gap-2"
      onSubmit={handleSubmit(onSubmit)}
      showSkeleton={isLoading || categoriesIsLoading || etagLabelsIsLoading}
      {...methods}
    >
      <div className="flex w-full flex-col justify-center gap-2">
        <div className="flex items-center gap-2">
          <FormSelect
            control={control}
            name="division"
            placeholder={t('Select...')}
            label={t('Category')}
            options={
              categoriesData
                ? categoriesData.map((e) => ({ label: e.description, value: e.id }))
                : []
            }
            isLayoutRow
            isClearable
            wrapperClassName="w-44 flex-auto"
          />
          <FormInputRange
            name="rating__gte"
            nameTo="rating__lte"
            label={t('Rating Range')}
            isLayoutRow
            wrapperClassName="w-52"
            error={errors.rating__gte || errors.rating__lte}
            registerOptions={{
              min: {
                value: 0,
                message: t('Min is {{n}}', { n: 0 })
              },
              max: {
                value: 5,
                message: t('Max is {{n}}', { n: 5 })
              }
            }}
          />
          <FormInput
            name="item_code__icontains"
            label={t('JAN')}
            isLayoutRow
            wrapperClassName="w-24 flex-auto"
            disabled={isGraphOn}
          />
          <FormInput
            name="etag_registered_serial__icontains"
            label={t('Etag')}
            isLayoutRow
            wrapperClassName="w-24 flex-auto"
            disabled={isGraphOn}
          />
          <FormInput
            name="item_disp__icontains"
            label={t('Product Name')}
            isLayoutRow
            wrapperClassName="w-44 flex-auto"
            disabled={isGraphOn}
          />
          <FormInputRadios
            name="period"
            label={t('Installed')}
            isLayoutRow
            wrapperClassName="w-44 whitespace-nowrap"
            radioOptions={[{ name: t('More') }, { name: t('Less') }]}
            disabled={isGraphOn}
          />
        </div>
        <div className="flex items-center gap-2">
          <FormSelect
            control={control}
            name="weekday"
            label={t('Weekday')}
            options={daysOfWeek}
            isLayoutRow
            isClearable
            defaultValue={{ label: t('All'), value: 0 }}
            placeholder={t('Select...')}
            wrapperClassName="w-1/4"
          />
          <FormSelectRadios
            control={control}
            name="etag_label_display"
            placeholder={t('Select...')}
            label={t('Display')}
            options={
              etagLabelsData?.display
                ? etagLabelsData.display.map((e) => ({ label: e, value: e }))
                : []
            }
            isLayoutRow
            isClearable
            wrapperClassName="w-1/3 whitespace-nowrap"
            radioOptions={[{ name: t('Include') }, { name: t('Exclude') }]}
          />
          <FormSelectRadios
            control={control}
            name="etag_label_location"
            placeholder={t('Select...')}
            label={t('Location')}
            options={
              etagLabelsData?.location
                ? etagLabelsData.location.map((e) => ({ label: e, value: e }))
                : []
            }
            isLayoutRow
            isClearable
            wrapperClassName="w-1/3 whitespace-nowrap"
            radioOptions={[{ name: t('Include') }, { name: t('Exclude') }]}
          />
          <FormSelectRadios
            control={control}
            name="etag_label_identify"
            placeholder={t('Select...')}
            label={t('Identify')}
            options={
              etagLabelsData?.identify
                ? etagLabelsData.identify.map((e) => ({ label: e, value: e }))
                : []
            }
            isLayoutRow
            isClearable
            wrapperClassName="w-1/3 whitespace-nowrap"
            radioOptions={[{ name: t('Include') }, { name: t('Exclude') }]}
          />
        </div>
      </div>
      <div className="flex flex-col justify-center gap-2 whitespace-nowrap">
        <Button variant="secondary" onClick={onReset}>
          {t('Reset')}
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {t('Submit')}
        </Button>
      </div>
    </MyForm>
  );
}
