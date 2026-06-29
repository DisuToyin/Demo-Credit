import type { Response } from "express";

type SuccessResponseOptions<TData> = {
  statusCode?: number;
  message: string;
  data?: TData;
};

export const sendSuccess = <TData>(
  res: Response,
  options: SuccessResponseOptions<TData>
): void => {
  res.status(options.statusCode ?? 200).json({
    status: "success",
    message: options.message,
    ...(options.data === undefined ? {} : { data: options.data }),
  });
};
