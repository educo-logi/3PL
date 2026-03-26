import React from 'react';

const AddressDisplay = ({ data, showJibun, layout = 'mypage' }) => {
  if (!data) return null;

  // Extract address info
  const road_address = data.road_address || data.roadAddress || '';
  const jibun_address = data.jibun_address || data.jibunAddress || '';
  const detail_address = data.detail_address || data.detailAddress || '';
  
  const locationText = `${data.location || ''} ${data.city || ''} ${data.dong || ''}`.trim();
  const isLegacy = !road_address && !jibun_address;
  
  let baseLine = '';
  let detailLine = '';

  const trySplitAddress = (fullStr) => {
    // Regex to split road/jibun base and detail.
    // Handles Korean address endings: 로, 길, 동, 리, 읍, 면 + optional numbers (e.g. 123 or 123-45)
    const match = fullStr.match(/^(.*?[로길동리읍면]\s*\d*(?:-\d+)?(?:번길?\s*\d*(?:-\d+)?)?)\s+(.+)$/);
    if (match && match[2]) {
      const detailStr = match[2].trim();
      // If the matched detail is just a number (e.g. "123" or "123-45"), it's not a real detail, it's part of the base address.
      const isJustNumber = !isNaN(Number(detailStr.replace(/-/g, '').replace(/ /g, '')));
      if (!isJustNumber) {
        return { base: match[1].trim(), detail: detailStr };
      }
    }
    return null;
  };

  if (isLegacy) {
    // Legacy data: detail_address contains the FULL address string.
    const fullStr = detail_address || locationText;
    const splitResult = trySplitAddress(fullStr);
    
    if (splitResult) {
      if (showJibun) {
        baseLine = locationText;
        detailLine = splitResult.detail;
      } else {
        baseLine = splitResult.base;
        detailLine = splitResult.detail;
      }
    } else {
      if (showJibun) {
        baseLine = locationText;
        // Detail fallback: Just remove location and city if possible so it doesn't repeat.
        let fallbackDetail = fullStr !== locationText ? fullStr.replace(data.location || '', '').replace(data.city || '', '').trim() : '';
        detailLine = fallbackDetail;
      } else {
        baseLine = fullStr;
        detailLine = '';
      }
    }
  } else {
    // New data: road and jibun are natively separated.
    baseLine = showJibun ? (jibun_address || locationText) : (road_address || locationText);
    detailLine = detail_address;
    
    // Fallback split in case of buggy save (e.g. user saved full string into road_address by accident)
    if (!detailLine && baseLine) {
        const splitResult = trySplitAddress(baseLine);
        if (splitResult) {
            baseLine = splitResult.base;
            detailLine = splitResult.detail;
        }
    }
  }

  // Formatting styles based on layout context
  if (layout === 'modal') {
    return (
      <>
        <p className="text-base truncate font-bold text-gray-900">{baseLine}</p>
        <p className="text-sm truncate text-gray-600 mt-1 h-5">{detailLine}</p>
      </>
    );
  }

  // Default layout (MyPage, Detail pages)
  return (
    <>
      <p className="text-lg font-bold text-gray-900">{baseLine}</p>
      <p className="text-base text-gray-600 mt-1 h-6">{detailLine}</p>
    </>
  );
};

export default AddressDisplay;
