import {
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MinusSmallIcon
} from '@heroicons/react/24/outline';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DateTime, Duration } from 'luxon';

import Table from '~/components/Table';

function UpOrDownCell(value) {
  return value >= 999 ? (
    <div className="inline-flex gap-1">
      <ChevronDoubleUpIcon className="h-6 w-6 text-emerald-500" />
      {value}%
    </div>
  ) : value > 0 ? (
    <div className="inline-flex gap-1">
      <ChevronUpIcon className="h-6 w-6 text-emerald-500" />
      {value}%
    </div>
  ) : value < -99 ? (
    <div className="inline-flex gap-1">
      <ChevronDoubleDownIcon className="h-6 w-6 text-rose-500" />
      {value}%
    </div>
  ) : value < 0 ? (
    <div className="inline-flex gap-1">
      <ChevronDownIcon className="h-6 w-6 text-rose-500" />
      {value}%
    </div>
  ) : (
    <div className="inline-flex gap-1">
      <MinusSmallIcon className="h-6 w-6" />
      {value}%
    </div>
  );
}

export default function SaleItemTable({
  data,
  sortingState,
  onSortingChange,
  setIsGraphOn,
  setSelectedRow
}) {
  const { i18n, t } = useTranslation();

  const columns = useMemo(
    () => [
      { accessorKey: 'item_code', header: t('JAN') }, // JANコード
      { accessorKey: 'item_disp', header: t('Product Name') }, // 商品名
      { accessorKey: 'division_name', header: t('Category') },
      { accessorKey: 'etag_registered_serial', header: t('Etag') },
      {
        accessorKey: 'etag_registered_period',
        header: t('Installed'),
        cell: (props) =>
          Duration.fromObject({ days: props.getValue() }, { locale: i18n.language }).toHuman()
      }, // 期間
      {
        id: 'rating',
        header: t('Review Score'),
        accessorFn: (data) =>
          `${data.rating / 10} [${data.star_1_cnt || 0} ${data.star_2_cnt || 0} ${
            data.star_3_cnt || 0
          } ${data.star_4_cnt || 0} ${data.star_5_cnt || 0}]`
      }, // Review点数
      {
        accessorKey: 'sales_price_after',
        header: t('Price (After) ($)'),
        cell: (props) => props.getValue() / 100
      },
      {
        accessorKey: 'sales_price_change_rate',
        header: t('Price Ratio'),
        cell: (props) => UpOrDownCell(props.getValue())
      }, // 価格比
      {
        accessorKey: 'sale_count_after',
        header: t('Sales PI Count'),
        cell: (props) => props.getValue() / 10000
      },
      {
        accessorKey: 'sales_count_per_k_change_rate',
        header: t('Sales PI Count Increase'),
        cell: (props) => UpOrDownCell(props.getValue())
      }, // 1000名あたり販売増減
      {
        accessorKey: 'profit_after',
        header: t('PI Profit'),
        cell: (props) => props.getValue() / 100
      },
      {
        accessorKey: 'profit_per_k_change_rate',
        header: t('PI Profit Increase'),
        cell: (props) => UpOrDownCell(props.getValue())
      },
    ],
    [i18n.language, t]
  );

  function handleRowSelection(e) {
    const newSelection = e();
    const rowId = newSelection !== undefined && Object.keys(newSelection)[0];
    if (rowId) {
      setIsGraphOn(true);
      setSelectedRow(rowId);
    }
  }

  return (
    <section className="h-1/2 grow">
      <Table
        data={data.map((e) => ({ ...e, id: e.item_id }))}
        columns={columns}
        sortingState={sortingState}
        onSortingChange={onSortingChange}
        setRowSelection={handleRowSelection}
      />
    </section>
  );
}
