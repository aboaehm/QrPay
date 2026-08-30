(function(){
  // Minimal local Supabase client shim that implements the small surface used by index.html.
  // It uses Supabase REST endpoints under the provided SUPABASE_URL and the provided key for Authorization.
  // This shim is intentionally small and only supports the patterns used in this app: from(table).upsert(...) and from(table).select(...).eq(...).single().
  window.supabase = window.supabase || {};
  window.supabase.createClient = function(baseUrl, apiKey) {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': apiKey,
      'Authorization': 'Bearer ' + apiKey
    };

    function tableClient(table) {
      return {
        upsert: async function(payload) {
          try {
            const res = await fetch(baseUrl + '/rest/v1/' + table, {
              method: 'POST',
              headers: Object.assign({'Prefer':'resolution=merge-duplicates'}, headers),
              body: JSON.stringify(payload)
            });
            if (!res.ok) {
              const text = await res.text();
              return { error: { message: text, status: res.status } };
            }
            const data = await res.json();
            return { data, error: null };
          } catch (e) {
            return { error: { message: String(e) } };
          }
        },
        select: function(selectStr) {
          // return an object supporting .eq(...).single()
          return {
            eq: function(col, val) {
              return {
                single: async function() {
                  try {
                    const query = `${baseUrl}/rest/v1/${table}?${encodeURIComponent(col)}=eq.${encodeURIComponent(val)}`;
                    const res = await fetch(query, { method: 'GET', headers });
                    if (!res.ok) {
                      const t = await res.text();
                      return { data: null, error: { message: t, status: res.status } };
                    }
                    const json = await res.json();
                    return { data: (json && json.length) ? json[0] : null, error: null };
                  } catch (e) {
                    return { data: null, error: { message: String(e) } };
                  }
                }
              };
            }
          };
        }
      };
    }

    return { from: tableClient };
  };
})();
