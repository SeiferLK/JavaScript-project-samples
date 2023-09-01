import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetAnalysisSaleItemInfo } from '~/api/analysis/saleitem_info';
import Button from '~/components/Elements/Button';
import MyPagination from '~/components/MyPagination';
import Spinner from '~/components/Spinner';
import useDebounce from '~/hooks/useDebounce';
import useSort from '~/hooks/useSort';
import { useAnalysisStore } from '~/stores/analysis';

import SaleItemFilters from './SaleItemFilters';
import SaleItemGraph from './SaleItemGraph';
import SaleItemTable from './SaleItemTable';

export default function SaleItem() {
  const { t } = useTranslation();
  const [isGraphOn, setIsGraphOn] = useState(false);
  const [isGraphProfit, setIsGraphProfit] = useState(false);
  const [selectedRow, setSelectedRow] = useState();

  const selectedStore = useAnalysisStore((state) => state.selectedStore);

  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const { sorting, ordering, onSortingChange } = useSort();
  const memoizedParams = useMemo(
    () => ({ store_id: selectedStore?.id, page, ordering, ...filters }),
    [filters, ordering, page, selectedStore?.id]
  );
  const debouncedParams = useDebounce(memoizedParams, 100);
  const { data, isLoading, isError } = useGetAnalysisSaleItemInfo(debouncedParams, {
    enabled: !!selectedStore,
    keepPreviousData: true
  });

  useEffect(() => {
    setPage(1);
  }, [selectedStore?.id, filters]);

  const selectedRowData = useMemo(() => {
    if (!data || !selectedRow) {
      return null;
    }
    const itemId = Number(selectedRow);
    return data.results.find((result) => result.item_id === itemId);
  }, [selectedRow, data]);

  const handleGraphButtonClick = () => {
    setSelectedRow();
    setIsGraphOn(!isGraphOn);
  };

  const handleGraphProfitButtonClick = () => {
    setIsGraphProfit(!isGraphProfit);
  };

  return (
    <div className="flex h-full flex-col gap-1">
      {!selectedRowData ? (
        <SaleItemFilters setFilters={setFilters} isLoading={isLoading} isGraphOn={isGraphOn} />
      ) : (
        <div className="flex justify-center gap-14 p-2 text-center text-lg text-white">
          <div>
            {t('JAN Code')}: {selectedRowData.item_code}
          </div>
          <div>
            {t('Product Name')}: {selectedRowData.item_disp}
          </div>
          <div>
            {t('Category')}: {selectedRowData.division_name}
          </div>
          <div>
            {t('Rating')}:{' '}
            {`${selectedRowData.rating / 10} [${selectedRowData.star_1_cnt || 0}
            ${selectedRowData.star_2_cnt || 0} ${selectedRowData.star_3_cnt || 0}
            ${selectedRowData.star_4_cnt || 0} ${selectedRowData.star_5_cnt || 0}]`}
          </div>
        </div>
      )}
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Spinner variant="light" size="lg" />
        </div>
      ) : isError ? (
        <div className="h-full text-white">{t('Something went wrong')}</div>
      ) : isGraphOn ? (
        <div className="h-full bg-white">
          <SaleItemGraph
            selectedStore={selectedStore}
            selectedRow={selectedRow}
            filters={filters}
            isGraphProfit={isGraphProfit}
          />
        </div>
      ) : (
        <>
          <SaleItemTable
            data={data.results}
            sortingState={sorting}
            onSortingChange={onSortingChange}
            setIsGraphOn={setIsGraphOn}
            setSelectedRow={setSelectedRow}
          />
          {data && (
            <MyPagination
              count={data.count}
              currentPage={page - 1}
              setCurrentPage={(page) => setPage(page + 1)}
            />
          )}
        </>
      )}
      <div className="flex justify-center gap-2">
        <Button onClick={handleGraphButtonClick}>
          {
            isGraphOn
              ? t('Back to index') //一覧に戻る
              : t('Graph') // 推移グラフ
          }
        </Button>
        {isGraphOn && (
          <Button onClick={handleGraphProfitButtonClick}>
            {isGraphProfit ? t('Show PI Count') : t('Show PI Profit')}
          </Button>
        )}
      </div>
    </div>
  );
}
