import { X, Building2, Users, ArrowRight } from 'lucide-react';
import useModalEffect from '../hooks/useModalEffect';

const SignupModal = ({ isOpen, onClose, onSelectWarehouse, onSelectCustomer }) => {
  const navigate = useNavigate();
  // 모달 효과 적용 (배경 잠금, 앱 새로고침 방지)
  useModalEffect(isOpen);

  // ESC 키로 모달 닫기
  React.useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleLoginClick = () => {
    onClose();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 pt-16"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              어떤 서비스를 이용하시나요?
            </h3>
            <p className="text-gray-600">
              창고를 제공하시는 창고업체이신가요, 아니면 창고를 찾으시는 고객사이신가요?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 창고업체 선택 */}
            <div 
              onClick={onSelectWarehouse}
              className="group cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  창고업체
                </h4>
                <p className="text-gray-600 mb-4">
                  보유하신 창고를 등록하고<br />
                  고객사와 연결되세요
                </p>
                <div className="flex items-center justify-center text-blue-600 font-medium group-hover:text-blue-700">
                  <span>창고 등록하기</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* 고객사 선택 */}
            <div 
              onClick={onSelectCustomer}
              className="group cursor-pointer bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  고객사
                </h4>
                <p className="text-gray-600 mb-4">
                  필요한 창고를 찾고<br />
                  창고업체와 연결되세요
                </p>
                <div className="flex items-center justify-center text-green-600 font-medium group-hover:text-green-700">
                  <span>고객사 등록하기</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">💡 도움이 필요하신가요?</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>창고업체:</strong> 물류 창고를 운영하고 계시는 업체</p>
              <p><strong>고객사:</strong> 창고 서비스가 필요한 화주사 또는 개인사업자</p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              이미 계정이 있으신가요?{' '}
              <button 
                onClick={handleLoginClick}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                로그인하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
