export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          <span className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SourceBan. All rights reserved.
          </span>
          <div className="mt-4 flex flex-col items-center sm:mt-0 sm:flex-row sm:space-x-4">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Quy định
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Bảo mật
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Liên hệ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}