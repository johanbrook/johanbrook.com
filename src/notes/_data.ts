import { format } from 'lume/deps/date.ts';
import { urlForNote } from '../_includes/permalinks.ts';

export const permalink = function (this: { date: Date }) {
	return `/mind#${format(this.date, 'yyyyMMddHHmm', {})}`;
};

export const url = urlForNote;
