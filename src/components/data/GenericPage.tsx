import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataPageScaffold, type Column } from "@/components/data/EditableTable";
import { type CreateDialogConfig } from "@/components/data/CreateDialog";

type Loader = () => Promise<
  Array<Record<string, unknown> & { id: string | number }>
>;

export function makeListLoader(path: string): Loader {
  return async () => {
    const { data } = await api.get(path);
    let arr: unknown[] = [];
    if (Array.isArray(data)) {
      arr = data;
    } else if (Array.isArray(data?.data)) {
      arr = data.data;
    } else if (Array.isArray(data?.items)) {
      arr = data.items;
    } else if (Array.isArray(data?.data?.items)) {
      arr = data.data.items;
    }
    return arr.map((x: unknown, i: number) => {
      const obj = x as Record<string, unknown>;
      return { id: (obj.id as string | number) ?? i, ...obj };
    });
  };
}

export function makePatcher(path: string) {
  return async (id: string | number, patch: Record<string, unknown>) => {
    // All VMS backend routes use PUT /:id for updates (not PATCH)
    await api.put(`${path}/${id}`, patch);
  };
}

export function makeDeleter(path: string) {
  return async (id: string | number) => {
    await api.delete(`${path}/${id}`);
  };
}

export function GenericPage(props: {
  title: string;
  description?: string;
  path: string;
  columns: Column<Record<string, unknown> & { id: string | number }>[];
  deletable?: boolean;
  createConfig?: CreateDialogConfig;
  /**
   * If provided, shows an Export button that downloads this URL as .xlsx.
   * Example: "/api/purchase-orders/export"
   */
  exportUrl?: string;
}) {
  const [loaderKey] = useState(() => props.path);
  useEffect(() => {
    document.title = `${props.title} · VMS`;
  }, [props.title]);
  return (
    <DataPageScaffold
      title={props.title}
      description={props.description}
      fetcher={makeListLoader(loaderKey)}
      columns={props.columns}
      saveEndpoint={makePatcher(loaderKey)}
      deleteEndpoint={
        props.deletable !== false ? makeDeleter(loaderKey) : undefined
      }
      createConfig={props.createConfig}
      exportUrl={props.exportUrl}
    />
  );
}
