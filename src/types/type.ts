interface Account {
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