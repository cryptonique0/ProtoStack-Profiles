'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/hooks/use-search';
import type { Profile } from '@/types/database.types';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ExploreFilters } from './explore-filters';
import { ProfileCard } from './profile-card';

export function ExploreContent() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    verified: false,
    hasNFTs: false,
    hasBadges: false,
    sortBy: 'newest' as 'newest' | 'oldest' | 'followers' | 'points',
  });

  const { query, setQuery, isSearching } = useSearch();

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch('/api/profiles?limit=50');
        const data = await response.json();
        setProfiles(data.data || []);
        setFilteredProfiles(data.data || []);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  useEffect(() => {
    let result = [...profiles];

    // Apply search
    if (query) {
      const searchLower = query.toLowerCase();
      result = result.filter(
        (profile) =>
          profile.display_name?.toLowerCase().includes(searchLower) ||
          profile.username?.toLowerCase().includes(searchLower) ||
          profile.ens_name?.toLowerCase().includes(searchLower) ||
          profile.address.toLowerCase().includes(searchLower) ||
          profile.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.verified) {
      result = result.filter((profile) => profile.is_verified);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      // Note: followers and points sorting would require additional data
    }

    setFilteredProfiles(result);
  }, [profiles, query, filters]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search profiles by name, username, ENS, or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {(filters.verified || filters.hasNFTs || filters.hasBadges) && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <ExploreFilters filters={filters} onChange={setFilters} />
        </motion.div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {isLoading
          ? 'Loading profiles...'
          : `${filteredProfiles.length} profiles found`}
      </div>

      {/* Profile grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No profiles found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredProfiles.map((profile, index) => (
            <ProfileCard key={profile.id} profile={profile} index={index} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
