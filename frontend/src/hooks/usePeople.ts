import { useState, useCallback, useEffect, useMemo } from 'react';
import { getAllPeople } from '../api/people';
import { Person } from '../types';

/**
 * Custom hook for managing people/contacts state
 */
export function usePeople(activeView: string) {
    const [allPeople, setAllPeople] = useState<Person[]>([]);
    const [peopleLoading, setPeopleLoading] = useState(false);
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [peopleSearchQuery, setPeopleSearchQuery] = useState('');

    const loadAllPeople = useCallback(async () => {
        setPeopleLoading(true);
        try {
            const people = await getAllPeople();
            setAllPeople(people);
        } catch (error) {
            console.error('Failed to load people:', error);
        } finally {
            setPeopleLoading(false);
        }
    }, []);

    // Load people when view becomes active
    useEffect(() => {
        if (activeView === 'people') {
            loadAllPeople();
        }
    }, [activeView, loadAllPeople]);

    // Filter people by search query
    const filteredPeople = useMemo(() => {
        if (!peopleSearchQuery.trim()) {
            return allPeople;
        }
        const q = peopleSearchQuery.trim().toLowerCase();
        return allPeople.filter((person) => {
            const name = person.full_name?.toLowerCase() ?? '';
            const email = person.email?.toLowerCase() ?? '';
            const role = person.role?.toLowerCase() ?? '';
            const company = person.company_name?.toLowerCase() ?? '';
            return name.includes(q) || email.includes(q) || role.includes(q) || company.includes(q);
        });
    }, [allPeople, peopleSearchQuery]);

    const selectedPerson = useMemo(() => {
        return allPeople.find((p) => p.id === selectedPersonId) ?? null;
    }, [allPeople, selectedPersonId]);

    const resetPeopleView = useCallback(() => {
        setSelectedPersonId(null);
        setPeopleSearchQuery('');
        loadAllPeople();
    }, [loadAllPeople]);

    return {
        allPeople,
        setAllPeople,
        peopleLoading,
        selectedPersonId,
        setSelectedPersonId,
        peopleSearchQuery,
        setPeopleSearchQuery,
        filteredPeople,
        selectedPerson,
        loadAllPeople,
        resetPeopleView,
    };
}
