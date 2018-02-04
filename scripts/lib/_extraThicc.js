const intraword1 = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', ' '
];
const intraword2 = [
    '卂', '乃', '匚', '刀', '乇', '下', '厶', '卄', '工', '丁', '长', '乚', '从', '𠘨', '口', '尸', '㔿', '尺', '丂', '丅', '凵', 'リ', '山', '乂', '  ',
];
module.exports = (text) => {
    let textArr = text.split('');
    for (let x = 0; x < intraword1.length - 1; x++) {
        if (!textArr.includes(intraword1[x])) continue;
        text = text.replace(new RegExp(intraword1[x], 'gi'), intraword2[x]);
    }
    return text;
};
