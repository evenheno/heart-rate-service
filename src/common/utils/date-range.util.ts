import { BadRequestException } from '@nestjs/common';

export interface ParsedDateRange {
  from?: Date;
  to?: Date;
}

export interface RequiredParsedDateRange {
  from: Date;
  to: Date;
}

export function parseOptionalDateRange(
  from?: string,
  to?: string,
): ParsedDateRange {
  const parsedFrom = from ? parseIsoDate(from, 'from') : undefined;
  const parsedTo = to ? parseIsoDate(to, 'to') : undefined;

  validateDateRange(parsedFrom, parsedTo);

  return {
    from: parsedFrom,
    to: parsedTo,
  };
}

export function parseRequiredDateRange(
  from: string,
  to: string,
): RequiredParsedDateRange {
  const parsedFrom = parseIsoDate(from, 'from');
  const parsedTo = parseIsoDate(to, 'to');

  validateDateRange(parsedFrom, parsedTo);

  return {
    from: parsedFrom,
    to: parsedTo,
  };
}

export function isWithinInclusiveRange(
  value: string,
  from?: Date,
  to?: Date,
): boolean {
  const current = new Date(value);

  if (Number.isNaN(current.getTime())) {
    return false;
  }

  return (!from || current >= from) && (!to || current <= to);
}

function parseIsoDate(value: string, fieldName: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(
      `${fieldName} must be a valid ISO-8601 date`,
    );
  }

  return date;
}

function validateDateRange(from?: Date, to?: Date): void {
  if (from && to && from > to) {
    throw new BadRequestException('from must be earlier than or equal to to');
  }
}
