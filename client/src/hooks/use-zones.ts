import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useZones() {
  return useQuery({
    queryKey: [api.zones.list.path],
    queryFn: async () => {
      const res = await fetch(api.zones.list.path);
      if (!res.ok) throw new Error("Failed to fetch zones");
      return api.zones.list.responses[200].parse(await res.json());
    },
  });
}
