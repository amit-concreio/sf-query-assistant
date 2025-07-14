export interface Account {
  Id: string;
  Name: string;
  Type?: string;
  Industry?: string;
  BillingAddress?: {
    city?: string;
    state?: string;
    country?: string;
  };
  Phone?: string;
  Website?: string;
  CreatedDate: string;
}

export interface DynamicQueryRequest {
  objectType: string;
  fields?: string[];
  filters?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

export interface SalesforceQueryResponse {
  totalSize: number;
  done: boolean;
  records: any[];
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}
