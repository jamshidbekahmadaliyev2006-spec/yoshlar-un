import React, { useState, useEffect } from 'react';
import { DashboardPage } from './pages/Dashboard';
import { MahallaPage } from './pages/Mahalla';
import { UsersPage } from './pages/Users';
import { EventsPage } from './pages/Events';
import { EventFormPage } from './pages/EventForm';
import { EventDetailsPage } from './pages/EventDetails';
import { SettingsPage } from './pages/Settings';

interface RouterProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const AppRouter: React.FC<RouterProps> = ({ currentRoute, onNavigate }) => {
  // Check if detail route matches "tadbir-(\d+)"
  const detailMatch = currentRoute.match(/^tadbir-(\d+)$/);

  if (detailMatch) {
    const eventId = parseInt(detailMatch[1], 10);
    return <EventDetailsPage eventId={eventId} onNavigate={onNavigate} />;
  }

  if (currentRoute === 'mahalla') {
    return <MahallaPage onNavigate={onNavigate} />;
  }

  if (currentRoute.startsWith('tadbir-qoshish')) {
    return <EventFormPage onNavigate={onNavigate} />;
  }

  switch (currentRoute) {
    case 'foydalanuvchilar':
      return <UsersPage />;
    case 'tadbirlar':
      return <EventsPage onNavigate={onNavigate} />;
    case 'sozlamalar':
      return <SettingsPage />;
    case 'dashboard':
    default:
      return <DashboardPage onNavigate={onNavigate} />;
  }
};

