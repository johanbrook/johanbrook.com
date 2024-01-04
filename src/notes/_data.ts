import { format } from 'lume/deps/date.ts';

export const permalink = function (this: { date: Date }) {
	return `/mind#${format(this.date, 'yyyyMMddHHmmss', {})}`;
};
