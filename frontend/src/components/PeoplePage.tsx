import { useState, useMemo } from 'react';
import {
    Search,
    Loader2,
    Mail,
    Trash2,
    Linkedin,
    X,
    ArrowUpDown,
    Filter,
    AlertCircle,
} from 'lucide-react';
import { Person } from '../types';
import { deletePerson } from '../api/people';
import { CompanyAvatar } from './CompanyAvatar';
import { cn } from '../lib/utils';

interface PeoplePageProps {
    people: Person[];
    loading: boolean;
    onPeopleChange: (people: Person[]) => void;
    onPersonSelect: (personId: string | null) => void;
    selectedPersonId: string | null;
}

const SENIORITY_OPTIONS = [
    { value: 'all', label: 'All Seniority' },
    { value: 'c-level', label: 'C-Level' },
    { value: 'vp', label: 'VP' },
    { value: 'director', label: 'Director' },
    { value: 'manager', label: 'Manager' },
    { value: 'senior', label: 'Senior' },
    { value: 'entry', label: 'Entry Level' },
];

const DEPARTMENT_OPTIONS = [
    { value: 'all', label: 'All Departments' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'HR' },
    { value: 'operations', label: 'Operations' },
    { value: 'product', label: 'Product' },
    { value: 'legal', label: 'Legal' },
];

type SortField = 'name' | 'confidence' | 'company';
type SortDirection = 'asc' | 'desc';

export function PeoplePage({
    people,
    loading,
    onPeopleChange,
    onPersonSelect,
    selectedPersonId,
}: PeoplePageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [seniorityFilter, setSeniorityFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [sortField, setSortField] = useState<SortField>('confidence');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [showFilters, setShowFilters] = useState(false);

    // Process and filter people
    const { verifiedPeople, unverifiedPeople } = useMemo(() => {
        let filtered = [...people];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.full_name?.toLowerCase().includes(q) ||
                p.email?.toLowerCase().includes(q) ||
                p.role?.toLowerCase().includes(q) ||
                p.company_name?.toLowerCase().includes(q) ||
                p.department?.toLowerCase().includes(q)
            );
        }

        // Seniority filter
        if (seniorityFilter !== 'all') {
            filtered = filtered.filter(p => {
                const seniority = (p.seniority || '').toLowerCase();
                const role = (p.role || '').toLowerCase();
                switch (seniorityFilter) {
                    case 'c-level':
                        return seniority.includes('c-level') ||
                            role.includes('ceo') ||
                            role.includes('cfo') ||
                            role.includes('cto') ||
                            role.includes('chief');
                    case 'vp':
                        return seniority.includes('vp') || role.includes('vice president');
                    case 'director':
                        return seniority.includes('director') || role.includes('director');
                    case 'manager':
                        return seniority.includes('manager') || role.includes('manager');
                    case 'senior':
                        return seniority.includes('senior') || role.includes('senior');
                    case 'entry':
                        return seniority.includes('entry') || seniority.includes('junior');
                    default:
                        return true;
                }
            });
        }

        // Department filter
        if (departmentFilter !== 'all') {
            filtered = filtered.filter(p => {
                const dept = (p.department || '').toLowerCase();
                const role = (p.role || '').toLowerCase();
                return dept.includes(departmentFilter) || role.includes(departmentFilter);
            });
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'confidence':
                    comparison = (a.confidence_score ?? 0) - (b.confidence_score ?? 0);
                    break;
                case 'name':
                    comparison = (a.full_name || '').localeCompare(b.full_name || '');
                    break;
                case 'company':
                    comparison = (a.company_name || '').localeCompare(b.company_name || '');
                    break;
            }
            return sortDirection === 'desc' ? -comparison : comparison;
        });

        // Split into verified (has name) and unverified
        const verified = filtered.filter(p => p.full_name && p.full_name.trim() !== '');
        const unverified = filtered.filter(p => !p.full_name || p.full_name.trim() === '');

        return { verifiedPeople: verified, unverifiedPeople: unverified };
    }, [people, searchQuery, seniorityFilter, departmentFilter, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleDelete = async (person: Person, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Delete ${person.full_name || person.email || 'this contact'}?`)) return;

        try {
            await deletePerson(person.id);
            onPeopleChange(people.filter(p => p.id !== person.id));
            if (selectedPersonId === person.id) {
                onPersonSelect(null);
            }
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete contact');
        }
    };

    const clearFilters = () => {
        setSeniorityFilter('all');
        setDepartmentFilter('all');
        setSearchQuery('');
    };

    const hasActiveFilters = seniorityFilter !== 'all' || departmentFilter !== 'all' || searchQuery.trim() !== '';

    const getConfidenceBadge = (score: number | null) => {
        if (score === null) return { text: '—', color: 'bg-slate-100 text-slate-500' };
        const pct = Math.round(score * 100);
        if (pct >= 80) return { text: `${pct}%`, color: 'bg-green-100 text-green-700' };
        if (pct >= 50) return { text: `${pct}%`, color: 'bg-amber-100 text-amber-700' };
        return { text: `${pct}%`, color: 'bg-red-100 text-red-700' };
    };

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Header with Search and Filters */}
            <div className="px-8 pt-6 pb-4 space-y-4">
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name, email, role, company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Toggle Filters */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors",
                            showFilters || hasActiveFilters
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                    </button>

                    {/* Stats */}
                    <div className="text-sm text-slate-500">
                        {verifiedPeople.length} verified • {unverifiedPeople.length} unverified
                    </div>
                </div>

                {/* Filter Row */}
                {showFilters && (
                    <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Seniority */}
                        <select
                            value={seniorityFilter}
                            onChange={(e) => setSeniorityFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {SENIORITY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {/* Department */}
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {DEPARTMENT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                            >
                                <X className="w-3 h-3" />
                                Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden px-8 pb-4">
                <div className={cn(
                    "bg-white overflow-y-auto flex flex-col border border-slate-200 rounded-xl shadow-sm h-full",
                    selectedPersonId ? "w-[60%]" : "w-full"
                )}>
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        </div>
                    ) : verifiedPeople.length === 0 && unverifiedPeople.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            {people.length > 0
                                ? "No contacts match your filters."
                                : "No contacts yet. Run a search to discover companies and their decision makers."}
                        </div>
                    ) : (
                        <>
                            {/* Verified Contacts Table */}
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-50 z-10">
                                    <tr>
                                        <th
                                            className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 cursor-pointer hover:bg-slate-100"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Name
                                                {sortField === 'name' && (
                                                    <ArrowUpDown className="w-3 h-3" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                                            Role
                                        </th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 hidden lg:table-cell">
                                            Seniority
                                        </th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 hidden lg:table-cell">
                                            Department
                                        </th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                                            Email
                                        </th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 text-center">
                                            LinkedIn
                                        </th>
                                        <th
                                            className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 cursor-pointer hover:bg-slate-100"
                                            onClick={() => handleSort('confidence')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Confidence
                                                {sortField === 'confidence' && (
                                                    <ArrowUpDown className="w-3 h-3" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 hidden md:table-cell">
                                            Source
                                        </th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 w-16">

                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100">
                                    {verifiedPeople.map((person) => {
                                        const confidence = getConfidenceBadge(person.confidence_score);
                                        const isHighlighted = person.is_ceo || person.is_founder || person.is_executive;

                                        return (
                                            <tr
                                                key={person.id}
                                                onClick={() => onPersonSelect(selectedPersonId === person.id ? null : person.id)}
                                                className={cn(
                                                    "group hover:bg-slate-50 transition-colors cursor-pointer",
                                                    selectedPersonId === person.id && "bg-indigo-50/50",
                                                    isHighlighted && "bg-amber-50/30"
                                                )}
                                            >
                                                {/* Name */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <CompanyAvatar
                                                            name={person.company_name || '?'}
                                                            website={person.company_website}
                                                            size={24}
                                                        />
                                                        <div>
                                                            <div className={cn(
                                                                "font-medium text-slate-900",
                                                                isHighlighted && "font-bold"
                                                            )}>
                                                                {person.full_name}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {person.company_name || '—'}
                                                            </div>
                                                        </div>
                                                        {person.is_ceo && (
                                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded">CEO</span>
                                                        )}
                                                        {person.is_founder && (
                                                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded">Founder</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate">
                                                    {person.role || '—'}
                                                </td>

                                                {/* Seniority */}
                                                <td className="py-3 px-4 text-slate-600 hidden lg:table-cell">
                                                    {person.seniority || '—'}
                                                </td>

                                                {/* Department */}
                                                <td className="py-3 px-4 text-slate-600 hidden lg:table-cell">
                                                    {person.department || '—'}
                                                </td>

                                                {/* Email */}
                                                <td className="py-3 px-4">
                                                    {person.email ? (
                                                        <a
                                                            href={`mailto:${person.email}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                                        >
                                                            <Mail className="w-3.5 h-3.5" />
                                                            <span className="truncate max-w-[150px]">{person.email}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>

                                                {/* LinkedIn */}
                                                <td className="py-3 px-4 text-center">
                                                    {person.linkedin_url ? (
                                                        <a
                                                            href={person.linkedin_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex text-blue-600 hover:text-blue-800"
                                                        >
                                                            <Linkedin className="w-4 h-4" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>

                                                {/* Confidence */}
                                                <td className="py-3 px-4">
                                                    <span className={cn(
                                                        "px-2 py-0.5 text-xs font-medium rounded",
                                                        confidence.color
                                                    )}>
                                                        {confidence.text}
                                                    </span>
                                                </td>

                                                {/* Source */}
                                                <td className="py-3 px-4 hidden md:table-cell">
                                                    <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded capitalize">
                                                        {person.source || 'unknown'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={(e) => handleDelete(person, e)}
                                                        className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Unverified Contacts Section */}
                            {unverifiedPeople.length > 0 && (
                                <div className="border-t border-slate-200">
                                    <div className="px-4 py-3 bg-amber-50/50 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        <span className="text-sm font-medium text-amber-800">
                                            Unverified Contacts ({unverifiedPeople.length})
                                        </span>
                                        <span className="text-xs text-amber-600">
                                            Missing name - may be generic emails
                                        </span>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <tbody className="text-sm divide-y divide-slate-100">
                                            {unverifiedPeople.map((person) => (
                                                <tr
                                                    key={person.id}
                                                    className="group hover:bg-slate-50 transition-colors opacity-60"
                                                >
                                                    <td className="py-2 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <CompanyAvatar
                                                                name={person.company_name || '?'}
                                                                website={person.company_website}
                                                                size={20}
                                                            />
                                                            <span className="text-slate-500 italic">No name</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-4 text-slate-500">{person.role || '—'}</td>
                                                    <td className="py-2 px-4 hidden lg:table-cell text-slate-500">{person.seniority || '—'}</td>
                                                    <td className="py-2 px-4 hidden lg:table-cell text-slate-500">{person.department || '—'}</td>
                                                    <td className="py-2 px-4">
                                                        {person.email ? (
                                                            <span className="text-slate-500">{person.email}</span>
                                                        ) : '—'}
                                                    </td>
                                                    <td className="py-2 px-4 text-center">—</td>
                                                    <td className="py-2 px-4">—</td>
                                                    <td className="py-2 px-4 hidden md:table-cell">
                                                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">
                                                            {person.source || 'unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        <button
                                                            onClick={(e) => handleDelete(person, e)}
                                                            className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
