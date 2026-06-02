import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  fetchBooks,
  fetchArticles,
  fetchAllQuotes,
  searchQuotes,
  type Book,
  type Article,
  type Quote,
  parseSource,
} from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

type Tab = 'books' | 'chapters' | 'titles';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export default function LibraryScreen() {
  const { colors, fontFamily, fontSize } = useSettings();

  const [tab, setTab] = useState<Tab>('books');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [chapterQuotes, setChapterQuotes] = useState<Quote[]>([]);

  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingChapterQuotes, setLoadingChapterQuotes] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Quote[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebounce(searchText, 400);
  const searchInputRef = useRef<TextInput>(null);

  // Load books once
  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .finally(() => setLoadingBooks(false));
  }, []);

  // Load articles when user navigates to chapters tab or selects a book
  useEffect(() => {
    if (tab !== 'chapters' && selectedBook === null) return;
    setLoadingArticles(true);
    fetchArticles()
      .then(setArticles)
      .finally(() => setLoadingArticles(false));
  }, [tab, selectedBook]);

  // Global search with API
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    searchQuotes(debouncedSearch.trim(), 50, 0)
      .then((r) => setSearchResults(r.items))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [debouncedSearch]);

  // Load quotes for selected chapter
  useEffect(() => {
    if (!selectedArticle) return;
    setLoadingChapterQuotes(true);
    setChapterQuotes([]);
    fetchAllQuotes()
      .then((all) => {
        const filtered = all.filter(
          (q) => q.source === selectedArticle.source,
        );
        setChapterQuotes(filtered);
      })
      .finally(() => setLoadingChapterQuotes(false));
  }, [selectedArticle]);

  // Filtered lists for each tab
  const filteredBooks = useMemo(() => {
    if (!searchText.trim()) return books;
    const q = searchText.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        `book ${b.id}`.includes(q),
    );
  }, [books, searchText]);

  const filteredArticles = useMemo(() => {
    const bookFiltered = selectedBook
      ? articles.filter((a) => a.book_number === selectedBook.id)
      : articles;
    if (!searchText.trim()) return bookFiltered;
    const q = searchText.toLowerCase();
    return bookFiltered.filter((a) => a.source.toLowerCase().includes(q));
  }, [articles, selectedBook, searchText]);

  const filteredChapterQuotes = useMemo(() => {
    if (!searchText.trim()) return chapterQuotes;
    const q = searchText.toLowerCase();
    return chapterQuotes.filter(
      (quote) =>
        quote.title.toLowerCase().includes(q) ||
        quote.body.toLowerCase().includes(q),
    );
  }, [chapterQuotes, searchText]);

  // Navigation helpers
  const selectBook = useCallback((book: Book) => {
    setSelectedBook(book);
    setSelectedArticle(null);
    setChapterQuotes([]);
    setSearchText('');
    setTab('chapters');
  }, []);

  const selectArticle = useCallback((article: Article) => {
    setSelectedArticle(article);
    setChapterQuotes([]);
    setSearchText('');
    setTab('titles');
  }, []);

  const goToTab = useCallback(
    (t: Tab) => {
      if (t === 'books') {
        setSelectedBook(null);
        setSelectedArticle(null);
        setChapterQuotes([]);
      } else if (t === 'chapters') {
        setSelectedArticle(null);
        setChapterQuotes([]);
      }
      setSearchText('');
      setTab(t);
    },
    [],
  );

  // ─── Render helpers ────────────────────────────────────────────────────────

  const TabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.headerBg }]}>
      {(['books', 'chapters', 'titles'] as Tab[]).map((t) => {
        const enabled =
          t === 'books' ||
          (t === 'chapters' && selectedBook !== null) ||
          (t === 'titles' && selectedArticle !== null);
        const active = tab === t;
        return (
          <TouchableOpacity
            key={t}
            onPress={() => enabled && goToTab(t)}
            disabled={!enabled}
            style={styles.tabItem}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: active
                    ? colors.accent
                    : enabled
                    ? colors.headerText
                    : colors.tabBarInactive,
                  fontFamily,
                },
              ]}
            >
              {t.toUpperCase()}
            </Text>
            {active && (
              <View style={[styles.tabUnderline, { backgroundColor: colors.accent }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const SearchBar = () => (
    <View style={[styles.searchRow, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}>
        <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
        <TextInput
          ref={searchInputRef}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={
            tab === 'books'
              ? 'Search books…'
              : tab === 'chapters'
              ? 'Search chapters…'
              : 'Search quotes, words…'
          }
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text, fontFamily, fontSize: fontSize - 1 }]}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Breadcrumb row shown on chapters/titles tabs
  const Breadcrumb = () => {
    if (tab === 'books') return null;
    return (
      <View style={[styles.breadcrumb, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => goToTab('books')} style={styles.breadcrumbItem}>
          <Text style={[styles.breadcrumbText, { color: colors.accent, fontFamily }]}>
            {selectedBook ? `Book ${selectedBook.id}` : 'Books'}
          </Text>
        </TouchableOpacity>
        {tab === 'titles' && selectedArticle && (
          <>
            <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
            <TouchableOpacity onPress={() => goToTab('chapters')} style={styles.breadcrumbItem}>
              <Text style={[styles.breadcrumbText, { color: colors.accent, fontFamily }]} numberOfLines={1}>
                {parseSource(selectedArticle.source).chapterTitle.slice(0, 30)}
                {parseSource(selectedArticle.source).chapterTitle.length > 30 ? '…' : ''}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  // ─── List renderers ────────────────────────────────────────────────────────

  const renderBook = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => selectBook(item)}
      activeOpacity={0.75}
    >
      <View style={styles.listItemLeft}>
        <Text style={[styles.listItemTitle, { color: colors.primary, fontFamily, fontSize }]}>
          Book {item.id}
        </Text>
        <Text style={[styles.listItemSub, { color: colors.text, fontFamily, fontSize: fontSize - 1 }]}>
          {item.title}
        </Text>
        <Text style={[styles.listItemMeta, { color: colors.textSecondary }]}>
          {item.chapterCount} chapters
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.accent} />
    </TouchableOpacity>
  );

  const renderArticle = ({ item }: { item: Article }) => {
    const p = parseSource(item.source);
    return (
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => selectArticle(item)}
        activeOpacity={0.75}
      >
        <View style={styles.listItemLeft}>
          {p.chapterNumber !== null && (
            <Text style={[styles.listItemMeta, { color: colors.accent }]}>
              Book {p.bookNumber} · Ch. {p.chapterNumber}
            </Text>
          )}
          <Text
            style={[styles.listItemTitle, { color: colors.primary, fontFamily, fontSize }]}
            numberOfLines={2}
          >
            {p.chapterTitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.accent} />
      </TouchableOpacity>
    );
  };

  const renderQuote = ({ item }: { item: Quote }) => {
    const preview = item.body.split('\n')[0] ?? '';
    return (
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => router.push(`/quote/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.listItemLeft}>
          <Text style={[styles.listItemTitle, { color: colors.primary, fontFamily, fontSize }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.listItemSub, { color: colors.text, fontFamily, fontSize: fontSize - 2 }]} numberOfLines={2}>
            {preview.length > 120 ? preview.slice(0, 117) + '…' : preview}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.accent} />
      </TouchableOpacity>
    );
  };

  // ─── Main content area ─────────────────────────────────────────────────────

  const renderContent = () => {
    // Global search results override tab-specific views
    if (debouncedSearch.trim()) {
      if (searching) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily }]}>
              Searching…
            </Text>
          </View>
        );
      }
      if (searchResults !== null) {
        if (searchResults.length === 0) {
          return (
            <View style={styles.centered}>
              <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily }]}>
                No results for "{debouncedSearch}"
              </Text>
            </View>
          );
        }
        return (
          <FlatList
            data={searchResults}
            keyExtractor={(q) => `search-${q.id}`}
            renderItem={renderQuote}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={[styles.resultCount, { color: colors.textSecondary, fontFamily }]}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{debouncedSearch}"
              </Text>
            }
          />
        );
      }
    }

    if (tab === 'books') {
      if (loadingBooks) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        );
      }
      return (
        <FlatList
          data={filteredBooks}
          keyExtractor={(b) => `book-${b.id}`}
          renderItem={renderBook}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (tab === 'chapters') {
      if (loadingArticles) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
          </View>
        );
      }
      return (
        <FlatList
          data={filteredArticles}
          keyExtractor={(a) => `article-${a.id}`}
          renderItem={renderArticle}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily }]}>
                No chapters found
              </Text>
            </View>
          }
        />
      );
    }

    // tab === 'titles'
    if (loadingChapterQuotes) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily }]}>
            Loading reflections…
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={filteredChapterQuotes}
        keyExtractor={(q) => `title-${q.id}`}
        renderItem={renderQuote}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily }]}>
              No reflections found
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.screenHeader, { backgroundColor: colors.headerBg }]}>
        <Text style={[styles.screenTitle, { color: colors.headerText, fontFamily }]}>
          Browse
        </Text>
      </View>

      <TabBar />
      <Breadcrumb />
      <SearchBar />

      <View style={{ flex: 1 }}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screenHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  screenTitle: {
    fontSize: 22,
    letterSpacing: 3,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 4,
  },
  breadcrumbItem: { paddingVertical: 2 },
  breadcrumbText: { fontSize: 12, letterSpacing: 0.5 },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 32,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 5,
  },
  listItemLeft: { flex: 1, marginRight: 8, gap: 3 },
  listItemTitle: { fontWeight: '600', lineHeight: 22 },
  listItemSub: { lineHeight: 19, fontStyle: 'italic' },
  listItemMeta: { fontSize: 11, letterSpacing: 0.5 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyText: { fontSize: 15, letterSpacing: 0.5 },
  loadingText: { fontSize: 13, marginTop: 8 },
  resultCount: { fontSize: 12, marginHorizontal: 16, marginBottom: 4 },
});
