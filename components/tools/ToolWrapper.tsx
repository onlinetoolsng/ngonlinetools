export function ToolWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
      <div className="p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}
