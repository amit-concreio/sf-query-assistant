import React from "react";

interface AggregateTableProps {
  data: any;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  singleRecord?: boolean;
  title?: string;
  emoji?: string;
}

export const AggregateTable = ({
  data,
  page,
  setPage,
  pageSize,
  singleRecord,
  title = "Aggregate Results",
  emoji = "📊",
}: AggregateTableProps) => {
  if (!data.records || !Array.isArray(data.records)) return null;

  const total = data.records.length;
  const start = singleRecord ? 0 : page * pageSize;
  const end = singleRecord ? 1 : Math.min(start + pageSize, total);
  const pageRecords = data.records.slice(start, end);

  // Get aggregate metadata
  const aggregateMetadata = data.aggregateMetadata;
  const aggregateFunctions = aggregateMetadata?.aggregateFunctions || [];
  const groupBy = aggregateMetadata?.groupBy || [];

  // Format aggregate values
  const formatAggregateValue = (value: any, fieldName: string) => {
    if (value === null || value === undefined) return "-";

    // Check if this is an aggregate field
    const isAggregateField = aggregateFunctions.some(
      (agg: any) =>
        fieldName.includes(agg.function) ||
        fieldName.includes(agg.alias || `${agg.function}_${agg.field}`)
    );

    if (isAggregateField) {
      // Format based on aggregate function type
      const aggFunc = aggregateFunctions.find(
        (agg: any) =>
          fieldName.includes(agg.function) ||
          fieldName.includes(agg.alias || `${agg.function}_${agg.field}`)
      );

      if (aggFunc) {
        switch (aggFunc.function) {
          case "COUNT":
            return value.toLocaleString();
          case "SUM":
          case "AVG":
            return typeof value === "number"
              ? value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : value;
          case "MIN":
          case "MAX":
            return typeof value === "number" ? value.toLocaleString() : value;
          default:
            return value;
        }
      }
    }

    return value;
  };

  // Get column headers
  const getColumnHeaders = () => {
    if (pageRecords.length === 0) return [];

    const firstRecord = pageRecords[0];
    return Object.keys(firstRecord).filter((key) => key !== "attributes");
  };

  const columnHeaders = getColumnHeaders();

  // Calculate totals for aggregate columns
  const calculateTotals = () => {
    if (pageRecords.length === 0) return {};

    const totals: any = {};
    columnHeaders.forEach((header) => {
      const isAggregateField = aggregateFunctions.some(
        (agg: any) =>
          header.includes(agg.function) ||
          header.includes(agg.alias || `${agg.function}_${agg.field}`)
      );

      if (isAggregateField) {
        const aggFunc = aggregateFunctions.find(
          (agg: any) =>
            header.includes(agg.function) ||
            header.includes(agg.alias || `${agg.function}_${agg.field}`)
        );

        if (aggFunc && aggFunc.function === "SUM") {
          const sum = pageRecords.reduce((acc: any, record: any) => {
            const value = record[header];
            return acc + (typeof value === "number" ? value : 0);
          }, 0);
          totals[header] = sum;
        }
      }
    });

    return totals;
  };

  const totals = calculateTotals();

  return (
    <div className="mt-3">
      <div className="text-sm font-semibold mb-2">
        {emoji} {title} ({total} groups)
      </div>

      {/* Aggregate Query Info */}
      {aggregateMetadata && (
        <div className="text-xs text-gray-600 mb-2 p-2 bg-gray-50 rounded">
          <div className="font-medium">Query Details:</div>
          <div>
            Functions:{" "}
            {aggregateFunctions
              .map((agg: any) => `${agg.function}(${agg.field})`)
              .join(", ")}
          </div>
          {groupBy.length > 0 && <div>Grouped by: {groupBy.join(", ")}</div>}
          {aggregateMetadata.having && (
            <div>Having: {aggregateMetadata.having}</div>
          )}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-xs border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {columnHeaders.map((header) => {
                const isAggregateField = aggregateFunctions.some(
                  (agg: any) =>
                    header.includes(agg.function) ||
                    header.includes(agg.alias || `${agg.function}_${agg.field}`)
                );
                const isGroupByField = groupBy.includes(header);

                return (
                  <th
                    key={header}
                    className={`border border-gray-300 px-2 py-1 text-left ${
                      isAggregateField
                        ? "bg-blue-50"
                        : isGroupByField
                        ? "bg-green-50"
                        : ""
                    }`}
                  >
                    <div className="font-medium">{header}</div>
                    {isAggregateField && (
                      <div className="text-xs text-gray-500">
                        {
                          aggregateFunctions.find(
                            (agg: any) =>
                              header.includes(agg.function) ||
                              header.includes(
                                agg.alias || `${agg.function}_${agg.field}`
                              )
                          )?.function
                        }
                      </div>
                    )}
                    {isGroupByField && (
                      <div className="text-xs text-gray-500">Group</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRecords.map((record: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                {columnHeaders.map((header) => {
                  const isAggregateField = aggregateFunctions.some(
                    (agg: any) =>
                      header.includes(agg.function) ||
                      header.includes(
                        agg.alias || `${agg.function}_${agg.field}`
                      )
                  );
                  const isGroupByField = groupBy.includes(header);

                  return (
                    <td
                      key={header}
                      className={`border border-gray-300 px-2 py-1 ${
                        isAggregateField
                          ? "bg-blue-50 font-medium"
                          : isGroupByField
                          ? "bg-green-50 font-medium"
                          : ""
                      }`}
                    >
                      {formatAggregateValue(record[header], header)}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Totals row */}
            {Object.keys(totals).length > 0 && (
              <tr className="bg-gray-200 font-bold">
                {columnHeaders.map((header) => {
                  const hasTotal = totals[header] !== undefined;
                  return (
                    <td
                      key={header}
                      className="border border-gray-300 px-2 py-1"
                    >
                      {hasTotal
                        ? formatAggregateValue(totals[header], header)
                        : "TOTAL"}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      {aggregateMetadata && (
        <div className="mt-2 text-xs text-gray-600">
          <div className="flex gap-4">
            <span>Groups: {total}</span>
            <span>
              Records per group:{" "}
              {pageRecords.length > 0
                ? Math.round(total / pageRecords.length)
                : 0}
            </span>
            {Object.keys(totals).length > 0 && <span>Sum totals shown</span>}
          </div>
        </div>
      )}

      {!singleRecord && (
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Showing {start + 1}–{end} of {total} groups
          </span>
          <button
            disabled={end >= total}
            onClick={() => setPage(page + 1)}
            className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
