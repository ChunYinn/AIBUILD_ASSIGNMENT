import { ExcelUpload } from '@/components/upload/ExcelUpload'

export const UploadPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Upload Data</h1>
          <p className="text-gray-600 text-sm sm:text-base">Import your Excel files to analyze procurement and sales data</p>
        </div>
        <ExcelUpload />
      </div>
    </div>
  )
}