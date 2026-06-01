export interface PlaceIndex {
  id: string;
  name: string;
  index: number;
  level: "city" | "country";
}

export interface IndexSource {
  resolve(query: string): Promise<PlaceIndex | null>;
  list(): Promise<Array<Pick<PlaceIndex, "id" | "name" | "level">>>;
}
