'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ExploreFiltersProps {
  filters: {
    verified: boolean;
    hasNFTs: boolean;
    hasBadges: boolean;
    sortBy: 'newest' | 'oldest' | 'followers' | 'points';
  };
  onChange: (filters: ExploreFiltersProps['filters']) => void;
}

export function ExploreFilters({ filters, onChange }: ExploreFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Toggle filters */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="verified"
                checked={filters.verified}
                onCheckedChange={(checked) =>
                  onChange({ ...filters, verified: checked })
                }
              />
              <Label htmlFor="verified">Verified only</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="hasNFTs"
                checked={filters.hasNFTs}
                onCheckedChange={(checked) =>
                  onChange({ ...filters, hasNFTs: checked })
                }
              />
              <Label htmlFor="hasNFTs">Has NFTs</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="hasBadges"
                checked={filters.hasBadges}
                onCheckedChange={(checked) =>
                  onChange({ ...filters, hasBadges: checked })
                }
              />
              <Label htmlFor="hasBadges">Has badges</Label>
            </div>
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <Label className="text-muted-foreground">Sort by:</Label>
            <div className="flex gap-1">
              {(['newest', 'oldest', 'followers', 'points'] as const).map(
                (option) => (
                  <Button
                    key={option}
                    variant={filters.sortBy === option ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onChange({ ...filters, sortBy: option })}
                    className="capitalize"
                  >
                    {option}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Clear filters */}
        {(filters.verified ||
          filters.hasNFTs ||
          filters.hasBadges ||
          filters.sortBy !== 'newest') && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange({
                  verified: false,
                  hasNFTs: false,
                  hasBadges: false,
                  sortBy: 'newest',
                })
              }
            >
              Clear all filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
