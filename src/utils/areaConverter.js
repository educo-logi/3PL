export const convertToPyeong = (squareMeters) => {
  return Math.round(squareMeters * 0.3025);
};

export const convertToSqm = (pyeong) => {
  return Math.round(pyeong / 0.3025);
};

// 항상 ㎡ 형식과 평 형식을 둘 다 반환하는 유틸
export const getAreaDisplayValues = (value, unit = 'sqm') => {
  if (!value) return { sqm: null, pyeong: null };
  const numValue = Number(value);
  if (isNaN(numValue)) return { sqm: null, pyeong: null };

  if (unit === 'pyeong') {
    return {
      sqm: convertToSqm(numValue).toLocaleString(),
      pyeong: numValue.toLocaleString()
    };
  } else {
    // default sqm
    return {
      sqm: numValue.toLocaleString(),
      pyeong: convertToPyeong(numValue).toLocaleString()
    };
  }
};

export const formatArea = (squareMeters) => {
  const pyeong = convertToPyeong(squareMeters);
  return `${squareMeters.toLocaleString()}㎡(${pyeong}평)`;
};

export const formatAreaShort = (squareMeters) => {
  const pyeong = convertToPyeong(squareMeters);
  return `${squareMeters.toLocaleString()}㎡(${pyeong}평)`;
};
