import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Search, Filter, X, Star, Calendar } from 'lucide-react'
import { generateYears } from '@/lib/utils'

interface EnhancedMovieFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  selectedYear: string
  onYearChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  ratingRange: [number, number]
  onRatingRangeChange: (range: [number, number]) => void
  releaseYearRange: [number, number]
  onReleaseYearRangeChange: (range: [number, number]) => void
  hasActiveFilters: boolean
}

export function EnhancedMovieFilters({
  search,
  onSearchChange,
  selectedYear,
  onYearChange,
  sortBy,
  onSortChange,
  onApplyFilters,
  onClearFilters,
  ratingRange,
  onRatingRangeChange,
  releaseYearRange,
  onReleaseYearRangeChange,
  hasActiveFilters
}: EnhancedMovieFiltersProps) {
  const years = generateYears(2020)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onApplyFilters()
    }
  }

  const handleClearAll = () => {
    onSearchChange('')
    onYearChange('')
    onSortChange('')
    onRatingRangeChange([0, 10])
    onReleaseYearRangeChange([1900, new Date().getFullYear()])
    onClearFilters()
  }

  return (
    <div className="space-y-4">
      {/* Basic filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search movies by title..."
              className="pl-10"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
          >
            <option value="">All Watched Years</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="">Sort by</option>
            <option value="title">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
            <option value="year">Release Year (Oldest)</option>
            <option value="year_desc">Release Year (Newest)</option>
            <option value="watchedYear">Watched Year (Oldest)</option>
            <option value="watchedYear_desc">Watched Year (Newest)</option>
            <option value="averageRating">Rating (Lowest)</option>
            <option value="averageRating_desc">Rating (Highest)</option>
            <option value="totalRankings">Ratings Count (Fewest)</option>
            <option value="totalRankings_desc">Ratings Count (Most)</option>
          </select>
          
          <Button onClick={onApplyFilters} variant="outline">
            Apply
          </Button>
          
          <Button 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            variant="outline" 
            size="icon"
            title="Advanced filters"
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          {hasActiveFilters && (
            <Button 
              onClick={handleClearAll} 
              variant="outline" 
              size="icon"
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAdvanced(false)}
            >
              Hide
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rating range filter */}
            <div className="space-y-3">
              <Label htmlFor="rating-range" className="flex items-center">
                <Star className="h-3 w-3 mr-1" />
                Rating Range
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="min-rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={ratingRange[0]}
                  onChange={(e) => onRatingRangeChange([parseFloat(e.target.value) || 0, ratingRange[1]])}
                  className="w-20"
                  placeholder="Min"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  id="max-rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={ratingRange[1]}
                  onChange={(e) => onRatingRangeChange([ratingRange[0], parseFloat(e.target.value) || 10])}
                  className="w-20"
                  placeholder="Max"
                />
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            </div>

            {/* Release year range filter */}
            <div className="space-y-3">
              <Label htmlFor="release-year-range" className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Release Year Range
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="min-year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={releaseYearRange[0]}
                  onChange={(e) => onReleaseYearRangeChange([parseInt(e.target.value) || 1900, releaseYearRange[1]])}
                  className="w-24"
                  placeholder="From"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  id="max-year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={releaseYearRange[1]}
                  onChange={(e) => onReleaseYearRangeChange([releaseYearRange[0], parseInt(e.target.value) || new Date().getFullYear()])}
                  className="w-24"
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          {/* Quick filter buttons */}
          <div className="space-y-2">
            <Label className="text-sm">Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRatingRangeChange([7, 10])}
              >
                Highly Rated (7+)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRatingRangeChange([0, 5])}
              >
                Low Rated (0-5)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReleaseYearRangeChange([2000, new Date().getFullYear()])}
              >
                21st Century
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReleaseYearRangeChange([1980, 1999])}
              >
                80s-90s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSortChange('totalRankings_desc')
                  onApplyFilters()
                }}
              >
                Most Rated
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSortChange('totalRankings')
                  onApplyFilters()
                }}
              >
                Least Rated
              </Button>
            </div>
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Filters:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearAll}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {search && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    Search: "{search}"
                    <button 
                      onClick={() => onSearchChange('')}
                      className="ml-1 hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {selectedYear && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    Watched: {selectedYear}
                    <button 
                      onClick={() => onYearChange('')}
                      className="ml-1 hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {sortBy && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    Sort: {sortBy.replace('_desc', ' (desc)').replace('_', ' ')}
                    <button 
                      onClick={() => onSortChange('')}
                      className="ml-1 hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {(ratingRange[0] > 0 || ratingRange[1] < 10) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    Rating: {ratingRange[0]}-{ratingRange[1]}
                    <button 
                      onClick={() => onRatingRangeChange([0, 10])}
                      className="ml-1 hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {(releaseYearRange[0] > 1900 || releaseYearRange[1] < new Date().getFullYear()) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    Release: {releaseYearRange[0]}-{releaseYearRange[1]}
                    <button 
                      onClick={() => onReleaseYearRangeChange([1900, new Date().getFullYear()])}
                      className="ml-1 hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}