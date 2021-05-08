export const generateSeperatedKey = () => {
    const chars = '0123456789',
        key = [];

    /* Generate four seperate codes, then merge them with a dash */
    for (let pairCount = 0; pairCount < 4; pairCount++) {
        let subkey = '';
        for (let subkeyCount = 0; subkeyCount < 4; subkeyCount++) {
            const randomCharPosition = Math.floor(Math.random() * chars.length);
            subkey += chars[randomCharPosition];
        }
        key.push(subkey);
    }

    return key.join('-');
};
