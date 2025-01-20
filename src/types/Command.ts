export interface Command {
    data: {
      name: string;
      description: string;
    };
    execute: (interaction: any) => Promise<void>;
  }