
import React, { useState } from 'react';
import { Table, Users, Search, Download, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CandidateListView from './candidates/CandidateListView';
import CandidateTableView from './candidates/CandidateTableView';
import CandidateMapView from './candidates/CandidateMapView';

const CandidateManagement = () => {
  const [activeView, setActiveView] = useState('table'); // Changed default to 'table'
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      {/* Header Controls */}
      <div className="bg-white border-b border-border py-4 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Candidate Management</h1>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates, skills, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* View Toggle - Updated to 3 columns */}
              <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    Table
                  </TabsTrigger>
                  <TabsTrigger 
                    value="map" 
                    className="flex items-center gap-2 opacity-50 cursor-not-allowed" 
                    disabled={true}
                  >
                    <Map className="h-4 w-4" />
                    Map
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filters Toggle removed */}

              {/* Export */}
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 border-r border-border bg-background p-6">
            <h3 className="font-semibold mb-4">Filters</h3>
            {/* Add filter components here later */}
            <div className="text-sm text-muted-foreground">
              Filter options will be added here
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          <Tabs value={activeView} className="h-full">
            <TabsContent value="list" className="mt-0 h-full">
              <CandidateListView searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent value="table" className="mt-0 h-full">
              <CandidateTableView searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent value="map" className="mt-0 h-full">
              <CandidateMapView searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CandidateManagement;
