export const convertToPyeong = (squareMeters) => {
  return Math.round(squareMeters * 0.3025);
};

export const convertToSqm = (pyeong) => {
  return Math.round(pyeong / 0.3025);
};

// 항상 ㎡ 형식과 평 형식을 둘 다 반환하는 유틸 (null 안전 처리)
export const getAreaDisplayValues = (value, unit = 'sqm') => {
  if (!value && value !== 0) return { sqm: '-', pyeong: '-' };
  const numValue = Number(value);
  if (isNaN(numValue)) return { sqm: '-', pyeong: '-' };

  try {
    if (unit === 'pyeong') {
      return {
        sqm: (convertToSqm(numValue) || 0).toLocaleString(),
        pyeong: (numValue || 0).toLocaleString()
      };
    } else {
      // default sqm
      return {
        sqm: (numValue || 0).toLocaleString(),
        pyeong: (convertToPyeong(numValue) || 0).toLocaleString()
      };
    }
  } catch (err) {
    console.warn('getAreaDisplayValues error:', err);
    return { sqm: '-', pyeong: '-' };
  }
};

export const formatArea = (squareMeters) => {
  if (squareMeters === null || squareMeters === undefined) return '-';
  const pyeong = convertToPyeong(squareMeters);
  return `${Number(squareMeters).toLocaleString()}㎡(${pyeong}평)`;
};

export const formatAreaShort = (squareMeters) => {
  if (squareMeters === null || squareMeters === undefined) return '-';
  const pyeong = convertToPyeong(squareMeters);
  return `${Number(squareMeters).toLocaleString()}㎡(${pyeong}평)`;
};
