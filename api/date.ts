// => 'yyyy-MM-dd HH:mm:ss'
// fileName: true => 'yyyy-MM-dd-HH-mm-ss'
export const formatDate = (date: Date, fileName = false) => {
    const datePart = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
        .map((n) => String(n).padStart(2, '0'))
        .join('-');

    const timePart = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
        .filter(Boolean)
        .map((n) => String(n).padStart(2, '0'))
        .join(fileName ? '-' : ':');

    if (fileName) {
        return datePart + '-' + timePart;
    }

    return datePart + ' ' + timePart;
};
