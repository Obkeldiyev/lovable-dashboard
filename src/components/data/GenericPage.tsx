import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataPageScaffold } from "@/components/data/EditableTable";

type Loader = () => Promise<Array<Record<string, unknown> & { id: string | number }>>;

export function makeListLoader(path: string): Loader {
  return async () => {
    try {
      const { data } = await api.get(path);
      const arr = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      return arr.map((x: Record<string, unknown>, i: number) => ({
        id: (x.id as string | number) ?? i,
        ...x,
      }));
    } catch {
      return [];
    }
  };
}

export function makePatcher(path: string) {
  return async (id: string | number, patch: Record<string, unknown>) => {
    await api.patch(`${path}/${id}`, patch);
  };
}

export function GenericPage(props: {
  title: string;
  description?: string;
  path: string;
  columns: { key: string; label: string; editable?: boolean; type?: "text" | "number" }[];
}) {
  const [loaderKey] = useState(() => props.path);
  useEffect(() => { document.title = `${props.title} · VMS`; }, [props.title]);
  return (
    <DataPageScaffold
      title={props.title}
      description={props.description}
      fetcher={makeListLoader(loaderKey)}
      columns={props.columns}
      saveEndpoint={makePatcher(loaderKey)}
    />
  );
}
