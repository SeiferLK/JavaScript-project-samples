import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { useGetAnalysisSaleItemResults } from '~/api/analysis/saleitem_results';
import RechartsClipPaths from '~/components/Chart/RechartsClipPaths';
import { getProfitPer1k, getSalesCountPer1k } from '~/helpers/utils';
import { getPriceInDollar } from '~/helpers/utils';
import { useZoomAndPan } from '~/hooks/recharts/useZoomAndPan';

export default function SaleItemGraph({ selectedStore, selectedRow, filters, isGraphProfit }) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);

  const { data } = useGetAnalysisSaleItemResults({
    store_id: selectedStore?.id,
    item_id: selectedRow,
    ...filters
  });

  const { clipPathRefs, onChartMouseDown, onChartMouseUp, setWrapperRef, onChartMouseMove } =
    useZoomAndPan({ chartLoaded: loaded });

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <ResponsiveContainer
      className="select-none"
      width="100%"
      height="100%"
      debounce={100}
      ref={setWrapperRef}
    >
      <ComposedChart
        data={data}
        onMouseMove={onChartMouseMove}
        onMouseDown={onChartMouseDown}
        onMouseUp={onChartMouseUp}
      >
        <CartesianGrid horizontal={false} />
        <defs>
          <RechartsClipPaths ref={clipPathRefs} />
        </defs>
        <XAxis
          dataKey="date"
          allowDataOverflow
          stroke="#ccc"
          tick={({ x, y, payload }) => (
            <g transform={`translate(${x},${y})`}>
              <line x1={0} y1={50} x2={0} y2={2000} stroke="#ccc" />
              <text x={0} y={0} dy={16} textAnchor="middle" fill="#666">
                {payload.value}
              </text>
            </g>
          )}
        />
        <Tooltip isAnimationActive={false} />
        <Legend
          verticalAlign="top"
          height={36}
          payload={[
            {
              value: isGraphProfit ? t('PI Profit') : t('Sales PI Count'),
              type: 'star'
            },
            ...(selectedRow
              ? [
                  { value: t('Price'), type: 'line', color: '#00b7ca' },
                  { value: t('Panel registered'), type: 'rect', color: '#F681A2' },
                  { value: t('Panel not registered'), type: 'rect', color: '#B3E072' }
                ]
              : [])
          ]}
        />

        <YAxis
          stroke="#ccc"
          yAxisId="sales_count_per_k"
          dataKey={getSalesCountPer1k}
          padding={{ top: 250 }}
          tick={({ x, y, width }) => (
            <g transform={`translate(${x},${y})`}>
              <line x1={2} y1={0} x2="97%" y2={0} stroke="#ccc" strokeDasharray="4" />
            </g>
          )}
        />
        <YAxis yAxisId="profit_in_cent" dataKey={getProfitPer1k} padding={{ top: 250 }} hide />
        {isGraphProfit ? (
          <Bar yAxisId="profit_in_cent" dataKey={getProfitPer1k} name={t('PI Profit')}>
            {data?.map((e, i) => (
              <Cell key={`cell-${i}`} fill={e.etag_registered ? '#F681A2' : '#B3E072'} />
            ))}
          </Bar>
        ) : (
          <Bar yAxisId="sales_count_per_k" dataKey={getSalesCountPer1k} name={t('Sales PI Count')}>
            {data?.map((e, i) => (
              <Cell key={`cell-${i}`} fill={e.etag_registered ? '#F681A2' : '#B3E072'} />
            ))}
          </Bar>
        )}

        <YAxis
          yAxisId={getPriceInDollar}
          dataKey={getPriceInDollar}
          padding={{ bottom: 250 }}
          hide
        />
        <Line
          yAxisId={getPriceInDollar}
          dataKey={getPriceInDollar}
          name={t('Price ($)')}
          stroke="#00b7ca"
          dot={false}
          connectNulls={true}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
