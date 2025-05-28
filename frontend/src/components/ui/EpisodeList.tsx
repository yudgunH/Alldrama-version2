// 'use client'

// import { useState } from 'react'
// import { ChevronDown, ChevronUp } from 'lucide-react'
// import Link from 'next/link'
// // import { generateEpisodeUrl } from '@/utils/url'

// interface Episode {
//   id: string
//   number: number
//   title: string
//   duration: string
//   views: number
//   isWatched?: boolean
// }

// interface EpisodeListProps {
//   episodes: Episode[]
//   currentEpisodeId?: string
//   movieId: string
//   movieTitle: string
//   defaultExpanded?: boolean
// }

// const EpisodeList = ({
//   episodes,
//   currentEpisodeId,
//   movieId,
//   movieTitle,
//   defaultExpanded = true
// }: EpisodeListProps) => {
//   const [isExpanded, setIsExpanded] = useState(defaultExpanded)
//   const [searchTerm, setSearchTerm] = useState('')

//   // Filter episodes based on search term
//   const filteredEpisodes = episodes.filter(episode =>
//     episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     episode.number.toString().includes(searchTerm)
//   )

//   // Sort episodes by number
//   const sortedEpisodes = [...filteredEpisodes].sort((a, b) => a.number - b.number)

//   return (
//     <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
//       {/* Header */}
//       <div 
//         className="flex items-center justify-between p-4 bg-gray-800 cursor-pointer"
//         onClick={() => setIsExpanded(!isExpanded)}
//       >
//         <h3 className="text-lg font-semibold text-white">
//           Danh sách tập ({episodes.length})
//         </h3>
//         {isExpanded ? (
//           <ChevronUp className="w-5 h-5 text-gray-400" />
//         ) : (
//           <ChevronDown className="w-5 h-5 text-gray-400" />
//         )}
//       </div>

//       {/* Search input */}
//       {isExpanded && (
//         <div className="p-3 border-b border-gray-800">
//           <input
//             type="text"
//             placeholder="Tìm tập phim..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
//           />
//         </div>
//       )}

//       {/* Episode list */}
//       {isExpanded && (
//         <div className="max-h-[400px] overflow-y-auto">
//           {sortedEpisodes.map((episode) => {
//             const isCurrent = episode.id === currentEpisodeId
//             const episodeUrl = generateEpisodeUrl(movieId, movieTitle, episode.id)

//             return (
//               <Link
//                 key={episode.id}
//                 href={episodeUrl}
//                 className={`block p-3 border-b border-gray-800 transition-colors duration-200 ${
//                   isCurrent
//                     ? 'bg-amber-500/10 text-amber-500'
//                     : 'hover:bg-gray-800 text-gray-300'
//                 }`}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <span className="font-medium">
//                       Tập {episode.number}
//                     </span>
//                     {episode.isWatched && (
//                       <span className="text-xs text-green-500">Đã xem</span>
//                     )}
//                   </div>
//                   <div className="flex items-center gap-4 text-sm">
//                     <span className="text-gray-400">{episode.duration}</span>
//                     <span className="text-gray-400">
//                       {new Intl.NumberFormat('vi-VN').format(episode.views)} lượt xem
//                     </span>
//                   </div>
//                 </div>
//                 {episode.title && (
//                   <p className="mt-1 text-sm text-gray-400 line-clamp-1">
//                     {episode.title}
//                   </p>
//                 )}
//               </Link>
//             )
//           })}
//         </div>
//       )}
//     </div>
//   )
// }

// export default EpisodeList 