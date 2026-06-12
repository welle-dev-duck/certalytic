<?php

namespace App\Http\Controllers\Candidates;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidates\BulkImportRequest;
use App\Jobs\ImportCandidatesJob;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BulkImportController extends Controller
{
    public function create(Team $current_team): Response
    {
        return Inertia::render('screenings/import', [
            'tokenUsage' => app(\App\Services\TokenService::class)->usageSummary($current_team),
        ]);
    }

    public function store(BulkImportRequest $request, Team $current_team): RedirectResponse
    {
        $rows = [];

        if ($request->hasFile('csv')) {
            $rows = $this->parseCsv($request->file('csv')->getRealPath());
        } elseif ($request->hasFile('cvs')) {
            $cvs = $request->file('cvs');
            $transcripts = $request->input('transcripts', []);

            foreach ($cvs as $index => $cv) {
                $rows[] = [
                    'name' => pathinfo($cv->getClientOriginalName(), PATHINFO_FILENAME),
                    'email' => null,
                    'transcript' => $transcripts[$index] ?? 'Interviewer: Walk me through your background.\nCandidate: See attached CV.',
                    'cv_path' => $cv->store('cvs', config('filesystems.default')),
                ];
            }
        }

        if ($rows === []) {
            return back()->withErrors(['csv' => 'No valid rows found in import.']);
        }

        ImportCandidatesJob::dispatch($current_team, $rows);

        return redirect()
            ->route('candidates.index', $current_team)
            ->with('success', count($rows).' candidate(s) queued for screening.');
    }

    /**
     * @return array<int, array{name: string, email: ?string, transcript: string, cv_path: ?string}>
     */
    private function parseCsv(string $path): array
    {
        $rows = [];
        $handle = fopen($path, 'r');

        if ($handle === false) {
            return [];
        }

        $headers = fgetcsv($handle);

        if ($headers === false) {
            fclose($handle);

            return [];
        }

        $headers = array_map(fn ($h) => strtolower(trim((string) $h)), $headers);

        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) !== count($headers)) {
                continue;
            }

            $row = array_combine($headers, $data);

            if ($row === false || empty($row['name'])) {
                continue;
            }

            $rows[] = [
                'name' => $row['name'],
                'email' => $row['email'] ?? null,
                'transcript' => $row['transcript'] ?? 'Interviewer: Tell me about yourself.\nCandidate: Details in CV.',
                'cv_path' => isset($row['cv_path']) ? Storage::put('cvs/imports', $row['cv_path']) : null,
            ];
        }

        fclose($handle);

        return $rows;
    }
}
