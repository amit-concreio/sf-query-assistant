export interface Account {
  Id: string;
  Name: string;
  Industry?: string;
  AnnualRevenue?: number;
  BillingCity?: string;
  Phone?: string;
  Website?: string;
}

export interface ReadQueryRequest {
  objectType: string;
  fields?: string[];
  filters?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateRequest {
  objectType: string;
  data: Record<string, any>;
}

export interface UpdateRequest {
  objectType: string;
  recordId: string;
  data: Record<string, any>;
}

export interface DeleteRequest {
  objectType: string;
  recordId: string;
}

export interface SalesforceQueryResponse {
  totalSize: number;
  done: boolean;
  records: any[];
}

export interface SalesforceOperationResponse {
  success: boolean;
  id?: string;
  message: string;
}

export interface QueryResult {
  records?: any[];
  success?: boolean;
  id?: string;
  message?: string;
  totalSize?: number;
}
