import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react'
import { useProductStore } from '@/store/products'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

export const ExcelUpload = () => {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { loadProductsFromAPI } = useProductStore()
  const navigate = useNavigate()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setErrorMessage('Please upload a valid Excel file (.xlsx or .xls)')
      setUploadStatus('error')
      return
    }

    setIsProcessing(true)
    setUploadStatus('idle')
    setErrorMessage(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)

      // Upload to backend
      const response = await api.post('/upload/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Clear progress interval and complete
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Show success message with validation info
      const validationInfo = response.data.validationInfo;
      let description = `Processed ${response.data.productsProcessed} products successfully.`;
      
      if (validationInfo) {
        description += ` Detected ${validationInfo.maxDaysDetected} days of data.`;
        
        if (validationInfo.warnings && validationInfo.warnings.length > 0) {
          description += ` Note: ${validationInfo.warnings[0]}`;
        }
      }
      
      toast({
        title: "Upload Successful!",
        description,
        variant: "default",
      })
      
      // Load updated products from API
      await loadProductsFromAPI()
      
      setTimeout(() => {
        setUploadStatus('success')
        setIsProcessing(false)
        
        // Navigate to dashboard after successful upload
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      }, 500)

    } catch (error: any) {
      const errorDetail = error.response?.data?.detail;
      let errorMsg = 'Failed to process Excel file. Please check the format and try again.';
      let errorList: string[] = [];
      
      if (errorDetail) {
        if (typeof errorDetail === 'string') {
          errorMsg = errorDetail;
        } else if (errorDetail.message) {
          errorMsg = errorDetail.message;
          if (errorDetail.errors && errorDetail.errors.length > 0) {
            errorList = errorDetail.errors;
          }
          if (errorDetail.warnings && errorDetail.warnings.length > 0) {
            errorList = [...errorList, ...errorDetail.warnings.map((w: string) => `Warning: ${w}`)];
          }
        }
      }
      
      setErrorMessage(errorList.length > 0 ? errorList.join('. ') : errorMsg);
      setUploadStatus('error');
      setIsProcessing(false);
      setUploadProgress(0);
      
      // Show main error in toast
      toast({
        title: "Upload Failed",
        description: errorMsg,
        variant: "destructive",
      });
      
      // Show detailed errors in additional toasts if available
      if (errorList.length > 0) {
        setTimeout(() => {
          toast({
            title: "Format Issues Detected",
            description: `${errorList.length} issue${errorList.length > 1 ? 's' : ''}: ${errorList.slice(0, 2).join('. ')}${errorList.length > 2 ? '...' : ''}`,
            variant: "destructive",
          });
        }, 1000);
      }
    }
  }

  const resetUpload = () => {
    setUploadStatus('idle')
    setErrorMessage(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="border border-gray-200 shadow-lg bg-white">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">Upload Excel Data</CardTitle>
        </div>
        <CardDescription className="text-gray-600">
          Import your procurement and sales data from Excel spreadsheets
        </CardDescription>
      </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            } ${uploadStatus === 'success' ? 'border-green-500 bg-green-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadStatus === 'success' ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700">Upload Successful!</h3>
                <p className="text-green-600">
                  Your data has been processed successfully. Redirecting to dashboard...
                </p>
              </div>
            ) : uploadStatus === 'error' ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-700">Upload Failed</h3>
                <p className="text-red-600 max-w-md mx-auto">{errorMessage}</p>
                <Button onClick={resetUpload} variant="outline" className="border-2">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-20 h-20 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Upload className="h-10 w-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isDragging ? 'Drop your file here' : 'Upload Excel File'}
                  </h3>
                  <p className="text-gray-600">
                    Drag & drop your file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports .xlsx and .xls files up to 10MB
                  </p>
                  <details className="text-sm text-gray-600 mt-4 border border-gray-200 rounded-lg">
                    <summary className="cursor-pointer hover:bg-gray-50 p-3 font-medium text-gray-700 flex items-center">
                      <File className="h-4 w-4 mr-2 text-blue-600" />
                      Expected Excel Format
                      <span className="ml-auto text-xs text-gray-400">Click to expand</span>
                    </summary>
                    <div className="p-4 bg-gray-50/50 border-t border-gray-200">
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          Required Columns
                        </h4>
                        <div className="space-y-2 ml-4">
                          <div className="flex items-start space-x-2">
                            <span className="text-green-600 font-mono text-xs mt-0.5">✓</span>
                            <div>
                              <code className="bg-blue-50 px-2 py-1 rounded text-xs font-mono text-blue-800">ID</code> 
                              <span className="text-gray-600 ml-2">or</span>
                              <code className="bg-blue-50 px-2 py-1 rounded text-xs font-mono text-blue-800 ml-2">Product ID</code>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-green-600 font-mono text-xs mt-0.5">✓</span>
                            <div>
                              <code className="bg-blue-50 px-2 py-1 rounded text-xs font-mono text-blue-800">Product Name</code> 
                              <span className="text-gray-600 ml-2">or</span>
                              <code className="bg-blue-50 px-2 py-1 rounded text-xs font-mono text-blue-800 ml-2">Name</code>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-green-600 font-mono text-xs mt-0.5">✓</span>
                            <code className="bg-blue-50 px-2 py-1 rounded text-xs font-mono text-blue-800">Opening Inventory</code>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          Day-specific Columns
                          <span className="text-xs text-gray-500 ml-2">(for each day: 1, 2, 3, etc.)</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600 font-mono text-xs">📦</span>
                              <code className="bg-green-50 px-2 py-1 rounded text-xs font-mono text-green-800">Procurement Qty (Day X)</code>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600 font-mono text-xs">💰</span>
                              <code className="bg-green-50 px-2 py-1 rounded text-xs font-mono text-green-800">Procurement Price (Day X)</code>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600 font-mono text-xs">🛒</span>
                              <code className="bg-orange-50 px-2 py-1 rounded text-xs font-mono text-orange-800">Sales Qty (Day X)</code>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600 font-mono text-xs">💵</span>
                              <code className="bg-orange-50 px-2 py-1 rounded text-xs font-mono text-orange-800">Sales Price (Day X)</code>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Example
                        </h4>
                        <div className="bg-white border rounded p-3 text-xs font-mono ml-4">
                          <div className="text-gray-600 mb-1">For 3 days of data:</div>
                          <div className="space-y-1">
                            <div className="text-blue-700">Procurement Qty (Day 1), Procurement Qty (Day 2), Procurement Qty (Day 3)</div>
                            <div className="text-green-700">Procurement Price (Day 1), Procurement Price (Day 2), Procurement Price (Day 3)</div>
                            <div className="text-orange-700">Sales Qty (Day 1), Sales Qty (Day 2), Sales Qty (Day 3)</div>
                            <div className="text-red-700">Sales Price (Day 1), Sales Price (Day 2), Sales Price (Day 3)</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          <span className="text-blue-600 text-lg">🚀</span>
                          <span className="font-semibold text-blue-800">Flexible & Unlimited</span>
                        </div>
                        <p className="text-blue-700 text-sm">
                          Supports any number of days! Just add more day columns as needed.
                        </p>
                      </div>
                    </div>
                  </details>
                </div>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="h-12 px-8 bg-gray-900 hover:bg-gray-800 text-white"
                  size="lg"
                >
                  <File className="h-5 w-5 mr-2" />
                  Choose File
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Processing file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

        </CardContent>
      </Card>
  )
}