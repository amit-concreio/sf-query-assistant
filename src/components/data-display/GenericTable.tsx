import React from "react";
import { AggregateTable } from "./AggregateTable";

interface GenericTableProps {
  data: any;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  singleRecord?: boolean;
  title?: string;
  emoji?: string;
}

export const GenericTable = ({
  data,
  page,
  setPage,
  pageSize,
  singleRecord,
  title = "Results",
  emoji = "📄",
}: GenericTableProps) => {
  if (!data.records || !Array.isArray(data.records)) return null;
  
  // Check if this is aggregate data
  const isAggregateData = data.aggregateMetadata && data.aggregateMetadata.queryType === "aggregate";
  
  // Route to AggregateTable if it's aggregate data
  if (isAggregateData) {
    return (
      <AggregateTable
        data={data}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        singleRecord={singleRecord}
        title={title}
        emoji={emoji}
      />
    );
  }
  
  const total = data.records.length;
  const start = singleRecord ? 0 : page * pageSize;
  const end = singleRecord ? 1 : Math.min(start + pageSize, total);
  const pageRecords = data.records.slice(start, end);

  return (
    <div className="mt-3">
      <div className="text-sm font-semibold mb-2">
        {emoji} {title} ({total} records)
      </div>
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-xs border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {pageRecords.length > 0 &&
                Object.keys(pageRecords[0])
                  .filter((key) => key !== "attributes")
                  .map((key) => (
                    <th
                      key={key}
                      className="border border-gray-300 px-2 py-1 text-left"
                    >
                      {key}
                    </th>
                  ))}
            </tr>
          </thead>
          <tbody>
            {pageRecords.map((record: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                {Object.keys(record)
                  .filter((key) => key !== "attributes")
                  .map((key) => (
                    <td key={key} className="border border-gray-300 px-2 py-1">
                      {record[key] !== null && record[key] !== undefined
                        ? record[key]
                        : "-"}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
            Showing {start + 1}–{end} of {total} records
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
