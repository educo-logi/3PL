import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const useDetailData = (id, tableName) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (error) throw error;

                if (mounted) {
                    setData(data);
                }
            } catch (err) {
                console.error(`Error fetching ${tableName}:`, err);
                if (mounted) {
                    setError(err);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            fetchData();
        }

        return () => {
            mounted = false;
        };
    }, [id, tableName]);

    return { data, loading, error };
};
