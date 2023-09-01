import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { DateTime } from 'luxon';

import { useGetShelfEtags } from '~/api/etags';
import Search from '~/components/Elements/Search';
import MyPagination from '~/components/MyPagination';
import Spinner from '~/components/Spinner';
import Table from '~/components/Table';
import useDebounce from '~/hooks/useDebounce';
import useSort from '~/hooks/useSort';

export default function ShelfTable() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { sorting, ordering, onSortingChange } = useSort();
  const memoizedQuery = useMemo(
    () => ({ page, ordering, search: searchTerm }),
    [page, ordering, searchTerm]
  );
  const debouncedQuery = useDebounce(memoizedQuery, 300);

  /** @type {import('@tanstack/react-query').UseQueryResult<{ count: number; results: import('./defs').ShelfEtag[] }>} */
  const { data, isLoading } = useGetShelfEtags(debouncedQuery, { keepPreviousData: true });

  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo(
    () => [
      { accessorKey: 'serial', header: t('Serial') },
      { accessorKey: 'gateway_serial', header: t('Gateway') },
      { accessorKey: 'store_name', header: t('Store') },
      { accessorKey: 'shelf_code', header: t('Shelf Code') },
      { accessorKey: 'shelf_name', header: t('Shelf Name') },
      { accessorKey: 'version', header: t('F/W') },
      {
        accessorKey: 'last_scanned_at',
        header: t('Last Access'),
        enableSorting: false,
        cell: (props) => {
          if (props.getValue()) {
            return DateTime.fromISO(props.getValue()).setLocale(i18n.language).toLocaleString({
              year: 'numeric',
              weekday: 'short',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
          } else {
            return 'N/A';
          }
        }
      },
      {
        accessorKey: 'last_scanned_rssi',
        header: t('Signal'),
        cell: (props) => (props.getValue() ? `${props.getValue()} dBm` : 'N/A'),
        enableSorting: false
      },
      {
        accessorKey: 'battery_percentage',
        header: t('Battery'),
        cell: (props) => `${props.getValue()}%`,
        enableSorting: false
      }
    ],
    [i18n.language, t]
  );

  function handleRowSelection(e) {
    setRowSelection(e);
    const newSelection = e();
    const rowId = newSelection !== undefined && Object.keys(newSelection)[0];
    if (rowId) {
      navigate(`/panel-manager/shelf/update/${rowId}`);
    } else if (rowId === undefined) {
      navigate('/panel-manager/shelf');
    }
  }

  if (isLoading) {
    return <Spinner variant="light" className="m-3 w-1/2" />;
  }

  return (
    <div className="flex h-full w-1/2 flex-1 flex-col justify-between p-1">
      <Search
        onChange={({ target: { value } }) => {
          setPage(1);
          setSearchTerm(value);
        }}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <div className="h-2" />
      <div className="h-1/2 grow">
        <Table
          data={data.results}
          columns={columns}
          sortingState={sorting}
          onSortingChange={onSortingChange}
          rowSelection={rowSelection}
          setRowSelection={handleRowSelection}
        />
      </div>
      <div className="-mb-1 pt-1">
        {data && (
          <MyPagination
            count={data.count}
            currentPage={page - 1}
            setCurrentPage={(page) => setPage(page + 1)}
          />
        )}
      </div>
    </div>
  );
}
